# Synopsis

op/send_messageから呼ばれる処理で、OPへのログインを担う。

# モジュールメソッド

## login

```
async login(client)
```

### 引数

唯一の引数として `client` を取る。

これはリクエストパスから得られたクライアントコードである。

### 戻り値

`status_code`, `status_msg`, `approval` プロパティを持つ `Object` を返す。

`approval` が真ならばログインに成功したことを示す。

`status_code` は `conf.status_code.SUCCESS_ZERO` が、 `status` は `conf.status.SUCCESS_ZERO` である。

`approval` が偽ならばログインに失敗したことを示す。

`status_code` は `conf.status_code.ERR_S_OPERATOR_LOGIN_908` が、 `status` は `conf.status.ERR_S_OPERATOR_LOGIN_908` である。

`approval` が偽のとき、 `type` としてエラーの原因となった箇所が文字列として入る。

一方、 `approval` が真のとき、`result` プロパティとして応答されたオブジェクトが入る。

呼び出し元においては `approval` で成否を判定した後、 `result` を用いて処理を継続する。 `result` の扱いは呼び出しモジュールによって異なり、OP固有の値で良い。

また、呼び出し元において `login` が呼び出されるのは未ログインの状態に限る。そのために呼び出し元はOPの情報をセッションに保存しなくてはならない。

### 呼び出し元

* `/module/operator/*/send_messages.js`

# エンドポイント

このモジュールはエンドポイントを持たない。