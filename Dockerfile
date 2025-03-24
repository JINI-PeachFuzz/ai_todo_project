# 1. Nginx 기반 이미지 사용
FROM nginx:alpine

# 2. 정적 파일을 nginx 기본 경로로 복사
COPY . /usr/share/nginx/html

# 3. 기본 포트 설정 (80)
EXPOSE 80