# Synopsis

ユーザーセッションを生成する。

# モジュールメソッド

## func (postSignUp)

```
async func(req, res)
```

### 引数

Expressのreq, resを引数に取る。

### 返り値

ステータスメッセージ文字列を返す。

### 副作用

#### 生成されるもの

##### namespace

値は

```javascript
`${conf.env.kvs.service}-${client}-${conf.env.environment}`
```

である。(`client`はクライアントコード)

##### IDs

`createIDs`によって生成される。

*これらのうち、 `rid` 及び `uid` の値は `createUser` に渡り、datastore上に保存される。*

##### hashIdPw

Boardingでも使用しているユーザーセッションIDとなるハッシュ値。

`encrypt` 及び seed session 生成のために使用される。
いずれも `hashIdPw`自体を保存することはないため、この値は外に出ない。

##### seed session

`createSeedSession`で得られる値。

このうち `token` 値が戻り値に含まれる。

##### user

`createUser`で得られる値。

#### resの設定

`express_res`を介してExpressの`res`値をセットする。

セットする値は成功時は`type`, `status_code`, `status_msg`, `token` のプロパティを持つObject、失敗時は`createSeedSession`の戻り値の`status`パラメータである。

# プライベートメソッド

## createIDs

```
async createIDs(logiD, ns, id)
```

### 引数

#### logiD

いつもの

#### ns

namespace

##### id

`req.body.id` であり、リクエストボディ中のID。つまり、ユーザーID。

### 戻り値

result Objectを返す。

#### type

文字列 `"SYSTEM"`

#### status\_code

`code.SUCCESS_ZERO` または `code.ERR_A_SYSTEM_990`

#### status\_msg

文字列

#### keep\_id

成功時のみ。

idがあれば`crypto.crypting`によって暗号化された`id`値、なければ`null`。

`crypto.crypting` は AES-256-GCM (v1ではAES-256-CBC) による暗号化を行う。

#### rid

ルームID。

```javascript
ds_conf.room.createRoom(ns)
```

によって生成されている。

#### id

ユーザーID。

datastoreのキーとして自動生成された値で、 `Number` 型。

## createUser

## createSeedSession

```
async createSeedSession(logiD, ns, hashIdPw, seed, encrypt, rid, uid)
```

### Synopsis

seed及びsessionをcreateする。

`createSeed`及び`createSession`が呼ばれる。

### 引数

#### logiD

`logiD`

#### ns

namespace.

#### hashIdPw

`hashIdPw`

#### seed

`crypto.seedRandom8`で得られる値。

#### encrypt

`hashIdPw`から得られる暗号化セッションID。

#### rid

rid (`createIDs`から引き継ぎ)

#### uid

uid (`createIDs`から引き継ぎ)

### 副作用

#### sessionの生成

*`kvs/datastore/queries.session/createSession`が呼ばれ、セッションが生成され、datastore上に保存される。*

引数 `encrypt` は `createSession` 側では `token` と呼ばれ、keyの一部分を構成する。

*ここで生成されるときに保存されるのは`rid`と`uid`である。*

# エンドポイント

`/post/signup`の実装である。