# Synopsis

C2Oでpubsubを介してメッセージを受け取った際に呼ばれる。

# モジュールメソッド

## func

```
async func(data)
```

### 引数

引数 `data` は`Object`型である。
datastoreの設定値のほか、関数名を指定した`exec`(ここでは値は`"send_msg_2op"`になる)と、`uuid`, `sessionId`のキーを持つ。

受け取り側として有意なのは`uuid`と`sessionId`に限られる。ただし、datastore設定値を持つため、datastoreへの問い合わせが可能で、実際

```javascript
    //Get session
    const session = await ds_conf.session.getBySessionId(data.namespace, data.sessionId);
```

のようにしてdatastoreに問い合わせてセッションを取得している。

`uuid`はpub/subにおいて受信メッセージを特定するためのものであるため、当ファイル上では使用していない。

### 呼び出し元

`/mobules/pubsub/subscripber_setter.js`において

```javascript
module.exports.send_msg_2op = send_message
```

と定義されており、`post_op_send_message.js`内で

```javascript
  const data = {
    exec : 'send_msg_2op',
    ...dsMessage.key,
    uuid : res_context.uuid,
    sessionId : params.token
  }
```

と定義されていることから、pubsubを介してsubscribeしたときに呼び出される。

この`exec`の値は`sendMessageTo*`関数そのものではなく、

```javascript
for(let idx in op_system) {
  send_message[idx] = op_system[idx].send_message
  send_message_disconnect[idx] = op_system[idx].send_message_disconnect
}
```

であるから、OP名をキーとした連想配列の値である。

この関数オブジェクトは最終的に`post_pubsub_subscribe.js`にて

```javascript
  const postRes = await subexec[parse_data.exec][client].func(parse_data)
    .catch(err => {
      console.error(err)
      throw new Error(err)
    })
```

という形で呼び出されている。
そのため、引数は`parse_data`であり、これはpubsubに投げたデータである。

### 戻り値

`post_message`の戻り値。

エラー時は`type`, `status_code`, `status_msg`, `approval=false`, `message`, `rid`を持つ連想配列。

# エンドポイント

このモジュールはエンドポイントを持たないが、間接的に`/post/message`をエンドポイントとする。

これは、同エンドポイントの実装である`post_op_send_message`がpub/sub経由で呼び出すためである。

# dsMessageについて

`deMessage`は

```javascript
await ds_conf.message.getMessageByMid(data.namespace, data.id)
```

によって取得されており、これはメッセージentityの配列を返す。

その後`post_message`の第二引数として`dsMessage[0]`を渡しているが、OPがOKSKYであるならば、この第二引数はそのまま使用される。しかし、他のOPの場合は、そのまま使用することはできないだろう。

しかし、`post_message`の引数は

```
client, data, *arg
```

である。つまり、第三引数以降はオプショナルな(OPごとの)引数であるが、第二引数までは固定で `client, dsMessage[0],` を渡すという方針となっている。

このことから、OP固有のパラメータへのアッセンブルは `send_message` ではなく `post_message` が担うべきものとなる。