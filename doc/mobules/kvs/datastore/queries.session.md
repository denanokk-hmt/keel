# Synopsis

datastoreにアクセスし、sessionを登録したり取得したりする。

# モジュールメソッド

## OAuth

```
async OAuth(logiD, client, hashIdPw, dflg, force_encrypt)
```

### Synopsis

ユーザーの認証を行い、成功すればセッション情報を返す。

### 引数

#### logiD

logiD

#### client

クライアントコード。

#### hashIdPw

`crypto/hashMac`によって得られる、`id`と`pw`の値を元にハッシュ化された値。

#### dflg

削除フラグ。Boolian。

`true`ならば当該セッションに削除フラグを立てる。
(現状削除はされない)

#### force\_encrypt

encrypt(token)の値。

通常、この値は与えられず、`OAuth`メソッド内で`hashIdPw`を用いてtoken値を生成する。
この値はその挙動をオーバーライドするものであり、その場合`hashIdPw`は使われない。

### 戻り値

`type`, `status_code`, `status_msg`, `approval`, `dflag`を持つ連想配列、またはsession entity

`status_code`及び`status_msg`の値としてはそれぞれ`code`, `status`のプロパティ

* `ERR_A_OAUTH_NONHUMAN_305` (rejectすべきbotアクセスである)
* `ERR_A_OAUTH_NON_303` (存在しないユーザーセッションである)
* `ERR_A_OAUTH_DEL_304` (削除されたユーザーセッションである)

のいずれかを返す。

## createSeed

```
async createSeed(ns, token, seed)
```

### Synopsis

ランダムな8文字のseed(`seedRandom8`で生成されたもの)をdatastore上に保存する。

### 引数

#### ns

datastoreのnamespace。

#### token

`hashIdPw`から導かれたtoken値。

#### seed

`seedRandom8`によって得られたランダムな8文字の文字列。

### 戻り値

失敗時は`type`が`"QRY"`で、`status_code`及び`status_msg`が`WAR_ALREADY_EXIST_103`プロパティであり、`seed`として重複するキーである連想配列

成功時は`putEntity`の戻り値。 (seed entityの値)

## createSession

```
async createSession(ns, token, rid, uid, newData={})
```

### Synopsis

新規セッションをdatastoreに登録する。

### 引数

#### ns

datastoreで使用されるnamespace値。

#### token

`hashIdPw`から得られる暗号化セッションID値。`encrypt`と呼ばれているものに同じ。

#### rid

room ID.

#### uid

User ID. (≠`req.body.id`)

#### newData

セッションとして保存したいデータの連想配列。

`op_`プレフィクスを持つキーの値はすべてここで指定する。

明示されたキー以外はストアされない。

## updateSeed

```
async updateSeed(ns, token, seed, old_seed, dflg)
```

### Synopsis

ランダムな8文字のseed(`seedRandom8`で生成されたもの)をdatastore上に更新して保存する。

### 引数

#### ns

datastoreのnamespace。

#### token

`hashIdPw`から導かれたtoken値。

#### seed

`seedRandom8`によって得られたランダムな8文字のHEX文字列。

#### old\_seed

置換え対象になる旧seed。

#### dflg

seed entityに削除フラグを立てるかどうか。
真であれば削除フラグを立てる。

### 戻り値

失敗した場合、`type`が`"QRY"`で、`status_code`及び`status_msg`が`WAR_ALREADY_EXIST_103`プロパティであり、`seed`としてdatastoreから取得されたseed entityである値が返る。

成功した場合、更新されたseed entityが返る。

### 戻り値についての補足

これは、seedはキーではなく値を構成するため、entityは上書きされる。キーは`ns`と`token`から導かれるため、既存のseed値はdatastore上から求められる。
その上で、与えられた旧seed値(つまり、`old_seed`)がdatastoreから得られた値と異なる場合、失敗となる。

## putSession

```
async putSession(ns, session, newData)
```

### synopsis

セッションを更新する

### 引数

#### ns

datastoreで使用されるnamespace値。

#### session

現行のセッションデータ

#### newData

セッションデータを更新したい値を持つ連想配列。

**この値は`newData.op_rid | null`のようになっており、`newData.op_rid || session.op_rid`ではないので注意すること。**
ここで更新される値に関してはすべて引数`newData`で明示的に引き継ぐ必要がある。

`newData`で更新されるキーは`op_`プレフィクスを持つすべてのキーである。

### 戻り値

```javascript
  return new Promise((resolve, reject) => {
    store.putEntity(entity).then(result => {
      resolve(result)
    })
      .catch(err => {
        console.log(err);
        reject(err)
      })
  });
```

## getBySessionId

```
getBySessionId(namespace, session_id)
```

### 引数

#### ns

datastoreのnamespace値

#### session_id

セッションID。datastoreのキー値となる。

### 戻り値

```javascript
return new Promise((resolve, reject) => {
  store.putEntity(entity).then(result => {
    resolve(result)
  })
    .catch(err => {
      console.log(err);
      reject(err)
    })
});
```

## getByFilter

# セッション値のキー一覧

* `type`
* `status_code`
* `status_msg`
* `token`
* `rid`
* `uid`
* `op_system`
* `op_access_token`
* `op_rid`
* `op_cust_uid`
* `op_ope_uid`
* `approval`
* `udt`

# `OAth`, `createSession`, `pubSession`の`data`値について

*datastoreのセッション値として新たな項目を追加したい場合、単にこれらのメソッドに渡す引数を変更するだけでなく、これらのメソッドでコンストラクトされる`data`を変更しなければならない。*

より良い方法があることはわかっているが、ここで手動で(manually)、明示的に行うことによって安全性をこのタイミングで保証したい、というのが平松さんの考えである。

また、JavaScriptにおいては`null !== undefined`である。

# opのsession値について

もともと

* `op_system`
* `op_access_token`
* `op_rid`
* `op_cust_rid`
* `op_ope_uid`

は最初のOPであるOKSKYにおいて使用されており、これらの使い回しが可能であるならば追加されたOPもこれらのキーを使うようになっている。

具体的には、LINE WORKSにおいてはユーザー固有の値は唯一`roomId`となるため、`op_rid`を使用し、それ以外は`null`である。

Slackの場合、`thread_td`として親投稿の`timestamp`値が入るが、これが`op_rid`として使われている。

# seedについて

seedは`seedRandom8`や`seedRandom16`で作られる、ランダムな文字列である。

これは`token`や`uid`とは別に存在し、datastore上で独立したkindとして保存されている。 (`ds_conf.KIND.SEED`)

seedの意義は暗号化saltとして使用するもので、seedには有効期限が設定されている。seed自体は大きな意味のない、ランダムな文字列であるが、saltに有効期限が設定され、定期的に更新されることで、セキュリティ強度を上げている。