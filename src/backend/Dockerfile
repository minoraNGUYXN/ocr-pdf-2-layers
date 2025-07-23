FROM python:3.10-bullseye

COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install torch==2.0.1+cu118 torchvision==0.15.2+cu118 torchaudio==2.0.2+cu118 --no-deps -f https://download.pytorch.org/whl/cu118/torch_stable.html
RUN pip install torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --no-deps
RUN pip install paddlepaddle-gpu==3.1.0 -i https://www.paddlepaddle.org.cn/packages/stable/cu118/
RUN pip install paddlepaddle==3.1.0 -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
RUN apt-get update && apt-get install -y libgl1

WORKDIR /app

COPY . .

USER root
RUN chmod -R 777 /app/*
# CMD ["python3","extract_api.py"]
ENTRYPOINT ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000","--reload"]
