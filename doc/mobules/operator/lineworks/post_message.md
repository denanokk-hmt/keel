# Synopsis

op/send_messageから呼ばれる処理で、LINE WORKSへのメッセージ投稿に担う。

# モジュールメソッド

## post\_message

```
async post_message(client, data, roomId)
```

### 引数

#### client

クライアントコード

#### data

`ds_conf.message.getMessageByMid`によって得られたメッセージオブジェクト(連想配列)。

#### roomId

LINE WORKSのroomId

### 戻り値

`result`, `status_code`, `status_msg`, `approval`を持つ連想配列。

エラー時の`status`及び`code`のプロパティは`ERR_S_OPERATOR_LOGIN_908`

LINE WORKSの場合、メッセージ投稿に成功した場合、サーバーはnullボディを返す。そのため、`JSON.parse`に失敗する。
このことから、`webclient`のエラーハンドルを切り替えて、専用のオブジェクトを返却させている。この場合の値は

```javascript
{
  "nullJSON": true,
  "rawBody": body
}
```

であるが、`body`は空であるため、`if (result["nullJSON"])` という判定しか道はないと思われる。

※ 歴史的経緯

`webclient`はこのためにエラーハンドル部分が改造された。

### 呼び出し元

* `/module/operator/lineworks/send_messages.js`

# エンドポイント

このモジュールはエンドポイントを持たない。