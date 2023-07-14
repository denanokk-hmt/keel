# Synopsis

op/send_messageから呼ばれる処理で、OKSKYへのメッセージ投稿に担う。

# モジュールメソッド

## post\_message

```
async post_message(client, data, op_rid, op_cust_uid, op_access_token)
```

### 引数

`data`内の値と重複する内容を追加の引数で受け取るようになっているが、これは`data`まではOP共通の必須引数で、以降がOP固有であるためである。

#### client

クライアントコード

#### data

`ds_conf.message.getMessageByMid`によって得られたメッセージオブジェクト(連想配列)。

#### op\_rid

`op_rid`値

#### op\_cust\_uid

`op_cust_uid`値

#### op\_access\_token

`op_access_token`値

### 戻り値

`result`, `status_code`, `status_msg`, `approval`を持つ連想配列。

エラー時の`status`及び`code`のプロパティは`ERR_S_OPERATOR_LOGIN_908`

### 呼び出し元

* `/module/operator/oksky/send_messages.js`

# エンドポイント

このモジュールはエンドポイントを持たない。