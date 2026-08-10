# 用户个人界面相关接口

## 获取用户信息
- `GET /users/{id}`
- Response: `{ id, username, nickname, avatar, bio, registeredAt, followerCount, followingCount }`

## 获取用户统计
- `GET /users/{id}/stats`
- Response: `{ loginCount, postCount, likeCount, commentCount }`

## 获取用户活动
- `GET /users/{id}/activities?page&size`
- Response: `{ list: [{ type, title, createdAt }], page, size, total }`

## 更新资料
- `PUT /users/{id}`
- Request: `{ nickname?, avatar?, bio? }`

## 修改密码
- `POST /account/password`
- Request: `{ oldPassword, newPassword }`

## 绑定邮箱
- `POST /account/bind-email`
- Request: `{ email }`

## 绑定手机
- `POST /account/bind-phone`
- Request: `{ phone }`

## 更新隐私设置
- `PUT /account/privacy`
- Request: `{ showEmail, showActivity }`