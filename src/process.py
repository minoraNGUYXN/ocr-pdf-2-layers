import os
import numpy as np
import cv2
import torch
import shutil
import pypdfium2
import re
from PIL import Image
from paddlex import create_model
from vietocr.tool.predictor import Predictor
from vietocr.tool.config import Cfg
from PyPDF2 import PdfMerger
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import stringWidth



class Process:
    def __init__(self, weights_url=None):
        """
        Khởi tạo class Det_Rec

        Args:
            weights_url (str): URL weights cho VietOCR (mặc định: sử dụng weights online)
        """
        # Đăng ký font
        font_path = "font/times.ttf"
        pdfmetrics.registerFont(TTFont('TimesNewRoman', font_path))

        # Cấu hình VietOCR
        config = Cfg.load_config_from_name('vgg_seq2seq')
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print("Thiết bị sử dụng:", device)
        if weights_url:
            config['weights'] = weights_url
            config['pretrain'] = weights_url
        else:
            config['weights'] = 'https://vocr.vn/data/vietocr/vgg_seq2seq.pth'
            config['pretrain'] = 'https://vocr.vn/data/vietocr/vgg_seq2seq.pth'

        # Khởi tạo models
        self.rec_model = Predictor(config)
        self.det_model = create_model(model_name="PP-OCRv5_server_det")

        print("Đã khởi tạo Det_Rec thành công!")

    def is_valid_roman_numeral(self, s):
        """Kiểm tra xem chuỗi có phải số La Mã hợp lệ không"""
        pattern = r'^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$'
        return bool(re.match(pattern, s.upper()))

    def fix_text_spacing(self, text):
        """Sửa khoảng cách trong text"""
        if not text or not text.strip():
            return text

        # Các quy tắc sửa khoảng cách
        text = re.sub(r'^(\d{1,2})(\.|:)([^\s])', r'\1\2 \3', text)
        text = re.sub(r'^(\d{1,2})\s+(\.|:)([^\s])', r'\1\2 \3', text)

        def roman_replacer(match):
            roman, sep, next_char = match.groups()
            return f"{roman}{sep} {next_char}" if self.is_valid_roman_numeral(roman) else match.group(0)

        text = re.sub(r'^([IVXLCDM]{1,10})(\.|:)([^\s])', roman_replacer, text, flags=re.IGNORECASE)
        text = re.sub(r'^([a-zA-Z])(\.|:)([^\s])', r'\1\2 \3', text)
        text = re.sub(r'^(\([0-9a-zA-Z]+\))([^\s])', r'\1 \2', text)
        text = re.sub(r'^(\d+(?:\.\d+)*\.)([^\s])', r'\1 \2', text)
        text = re.sub(r'(\([^)]+\))([a-zA-Z])', r'\1 \2', text)
        text = re.sub(r'([a-zA-Z0-9])\(', r'\1 (', text)
        text = re.sub(r'([a-zA-Z0-9]),([a-zA-Z0-9])', r'\1, \2', text)
        text = re.sub(r'([a-zA-Z])\.(\d)', r'\1. \2', text)
        text = re.sub(r'([a-z])\.([A-Z])', r'\1. \2', text)
        text = re.sub(r'([a-zA-Z])\[', r'\1 [', text)
        text = re.sub(r'\]([a-zA-Z])', r'] \1', text)
        text = re.sub(r'([a-zA-Z]):([a-zA-Z])', r'\1: \2', text)
        text = re.sub(r'([a-zA-Z]);([a-zA-Z])', r'\1; \2', text)
        text = re.sub(r'([a-zA-Z]{3,})-([a-zA-Z]{3,})', r'\1 - \2', text)

        return text

    def calculate_font_size_and_position(self, coord, text, img_height):
        """Tính toán kích thước font và vị trí"""
        x_coords = [p[0] for p in coord]
        y_coords = [p[1] for p in coord]
        bbox_width = max(x_coords) - min(x_coords)
        bbox_height = max(y_coords) - min(y_coords)
        font_size = bbox_height * 1.0
        x = min(x_coords)
        y = img_height - max(y_coords) + (bbox_height * 0.1)
        return x, y, font_size, bbox_width, bbox_height

    def adjust_font_size_to_fit_width(self, text, bbox_width, font_size, font_name="TimesNewRoman"):
        """Điều chỉnh kích thước font để phù hợp với chiều rộng"""
        try:
            text_width = stringWidth(text, font_name, font_size)
            if text_width == 0:
                return font_size
            return font_size * bbox_width / text_width
        except:
            return font_size

    def process_recognition(self, img_path, result, output_pdf_path, output_img_debug=None):
        """
        Xử lý ảnh OCR + tạo file PDF với text ẩn. Có thể thêm ảnh debug.

        Args:
            img_path (str): Đường dẫn ảnh đầu vào.
            result (dict): Kết quả detection từ PaddleOCR.
            output_pdf_path (str): Đường dẫn file PDF đầu ra.
            output_img_debug (str, optional): Nếu cung cấp, sẽ lưu ảnh có bounding boxes để debug.

        Returns:
            str: Đường dẫn file PDF đã sinh.
        """
        img = cv2.imread(img_path)
        img_with_boxes = img.copy()
        img_height, img_width = img.shape[:2]
        c = canvas.Canvas(output_pdf_path, pagesize=(img_width, img_height))
        c.drawImage(img_path, 0, 0, width=img_width, height=img_height)

        EXPEND = 5
        for res in result:
            dt_polys = res['dt_polys']
            dt_scores = res['dt_scores']
            boxes = []

            for poly in dt_polys:
                xs = [point[0] for point in poly]
                ys = [point[1] for point in poly]
                xmin, xmax = min(xs), max(xs)
                ymin, ymax = min(ys), max(ys)
                boxes.append([[int(xmin), int(ymin)], [int(xmax), int(ymax)]])

            valid_boxes, valid_scores, valid_polys = [], [], []

            for i, (box, score, poly) in enumerate(zip(boxes, dt_scores, dt_polys)):
                if score < 0.5:
                    continue
                x1, y1 = box[0]
                x2, y2 = box[1]
                x1 = max(0, x1 - EXPEND)
                y1 = max(0, y1 - EXPEND)
                x2 = min(img_width, x2 + EXPEND)
                y2 = min(img_height, y2 + EXPEND)
                if x2 > x1 and y2 > y1:
                    valid_boxes.append([[x1, y1], [x2, y2]])
                    valid_scores.append(score)
                    valid_polys.append(poly)

            for idx, (box, score, poly) in enumerate(
                    zip(reversed(valid_boxes), reversed(valid_scores), reversed(valid_polys))):
                x1, y1 = box[0]
                x2, y2 = box[1]
                if x1 >= x2 or y1 >= y2:
                    continue

                cropped_image = img[y1:y2, x1:x2]
                if cropped_image.shape[0] == 0 or cropped_image.shape[1] == 0:
                    continue

                try:
                    cropped_image_pil = Image.fromarray(cropped_image)
                    if cropped_image_pil.size[0] == 0 or cropped_image_pil.size[1] == 0:
                        continue
                    text = self.rec_model.predict(cropped_image_pil)
                    text = self.fix_text_spacing(text)
                except:
                    continue

                x, y, font_size, bbox_width, bbox_height = self.calculate_font_size_and_position(poly, text, img_height)
                font_size = self.adjust_font_size_to_fit_width(text, bbox_width, font_size)
                c.setFont("TimesNewRoman", font_size)
                c.setFillColor(Color(0, 0, 1, alpha=0.3))
                try:
                    c.drawString(x, y, text)
                except:
                    clean_text = ''.join(char if ord(char) < 128 else '?' for char in text)
                    c.drawString(x, y, clean_text)

                if output_img_debug:
                    pts = np.array(poly, dtype=np.int32)
                    cv2.polylines(img_with_boxes, [pts], True, (0, 255, 0), 2)
                    cv2.putText(img_with_boxes, str(idx),
                                (int(min([p[0] for p in poly])), int(min([p[1] for p in poly])) - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)

        if output_img_debug:
            cv2.imwrite(output_img_debug, img_with_boxes)

        c.save()
        return output_pdf_path

    def process_file(self, input_path, output_dir="./pdf_pages", final_output_name=None):
        """
        Xử lý file PDF hoặc ảnh

        Args:
            input_path (str): Đường dẫn file đầu vào (PDF hoặc ảnh)
            output_dir (str): Thư mục tạm để lưu các trang PDF
            final_output_name (str): Tên file PDF cuối cùng (mặc định: dựa trên tên file đầu vào)

        Returns:
            str: Đường dẫn file PDF đã tạo
        """
        # Tạo thư mục output nếu chưa có
        os.makedirs(output_dir, exist_ok=True)

        # Xác định tên file output
        if final_output_name is None:
            base_name = os.path.splitext(os.path.basename(input_path))[0]
            final_output_name = f"{base_name}_ocr.pdf"

        if input_path.lower().endswith(".pdf"):
            return self._process_pdf(input_path, output_dir, final_output_name)
        elif input_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            return self._process_image(input_path, final_output_name)
        else:
            raise ValueError("Định dạng file không hỗ trợ. Hãy dùng PDF hoặc ảnh PNG/JPG.")

    def _process_pdf(self, input_path, output_dir, final_output_name):
        pdf = pypdfium2.PdfDocument(input_path)
        num_pages = len(pdf)
        print(f"PDF có {num_pages} trang")
        page_pdf_paths = []

        for i, page in enumerate(pdf):
            pil_image = page.render().to_pil()
            img_path = os.path.join(output_dir, f"page_{i + 1}.png")
            pil_image.save(img_path)

            pdf_path = os.path.join(output_dir, f"page_{i + 1}_ocr.pdf")
            result = self.det_model.predict(img_path, batch_size=1)
            self.process_recognition(img_path, result, output_pdf_path=pdf_path)
            page_pdf_paths.append(pdf_path)
            print("Đã xử lí trang thứ" + str(i + 1))

        if num_pages == 1:
            shutil.copy(page_pdf_paths[0], final_output_name)
        else:
            merger = PdfMerger()
            for pdf_file in page_pdf_paths:
                merger.append(pdf_file)
            merger.write(final_output_name)
            merger.close()

        pdf.close()
        shutil.rmtree(output_dir)
        print(f"Đã bỏ folder trung gian")
        print(f"Đã tạo file PDF hoàn chỉnh: {final_output_name}")
        return final_output_name

    def _process_image(self, input_path, final_output_name):
        """Xử lý file ảnh"""
        result = self.det_model.predict(input_path, batch_size=1)
        self.process_recognition(input_path, result, output_pdf_path=final_output_name)
        print(f"Đã tạo PDF từ ảnh: {final_output_name}")
        return final_output_name
