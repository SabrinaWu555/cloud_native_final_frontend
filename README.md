# 企業訂餐系統 — 員工端前端

雲端原生課程期末專案的前端，使用 Next.js 開發。

## 技術棧

- Next.js 16（App Router）
- React 19
- Tailwind CSS 4
- Docker + Kubernetes

## 本機開發

```bash
# 安裝套件
npm install

# 複製環境變數範本，並填入後端 Kong API Gateway 位址
cp .env.example .env.local

# 啟動開發伺服器
npm run dev
```

打開 http://localhost:3000

## 測試帳號

- admin1@test.com / admin123（管理員）
- newuser@test.com（員工，密碼請洽組員）

## 部署

```bash
# 建置 Docker 映像
docker build -t employee-frontend:latest .

# 執行（記得帶環境變數）
docker run -p 3000:3000 --env-file .env.local employee-frontend:latest
```

## 專案結構

- `app/` Next.js App Router 頁面
- `app/api/` 伺服器端 API（負責跟後端微服務溝通）
- `components/` 共用元件
- `lib/` 工具函式（API 包裝、廠區、日期等）
- `k8s/` Kubernetes 部署檔