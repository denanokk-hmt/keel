# Synopsis

メッセージ処理に関わるdatastoreへのアクセス。

# モジュールメソッド

## postMessage

```
postMessage(ns, RID, UID, mtype, talk, mtime, init_flg, op_mid)
```

### Synopsis

新規メッセージをdatastoreに登録する。

### 引数

#### ns

datastoreのnamespace

#### RID, UID, mtype, talk, mtime, init_flag, op_mid

datastoreにセットする各エントリの値

### 戻り値

datastoreのリザルトを返すPromise

## getMessages

## getMessageByMid

```
getMessageByMid(ns, mid)
```

### Synopsis

メッセージIDを指定し、当該メッセージIDのメッセージを取得する。

### 引数

#### ns

datastoreのnamespace

#### mid

メッセージID

### 戻り値

メッセージentityの配列

### Description

この関数はpub/subを介した伝達においてKeelが受け取ったメッセージをsubした側で受け取るために使用される。

pub/subにおいてメッセージそのものは伝達されないため、subしてもsubした側はメッセージを持っていない。しかし、pubする前にメッセージはdatastore上に置かれており、メッセージIDを伝達することでdatastoreから当該メッセージを取得できるようにしている。

一見、複雑に見える仕組みは、OKSKYとの連携を図るにおいて、コードを分離(疎結合)し、OP側になるべく左右されずに確実にメッセージを取り扱うようにするためのものである。

## getMessageKeyByOpMid

```
getMessageKeyByOpMid(ns, op_mid)
```

### Synopsis

メッセージを `op_mid` で検索し、最初のエントリのキーを返す

### 引数

#### ns

datastoreのnamespace

#### op_mid

検索するメッセージのop_mid

### 返り値

検索結果の最初のエントリの *キー*

## updateMessage

```
updateMessage(id, ns, talk, original_msg)
```

### Synopsis

メッセージのtalkを更新する。

### 引数

#### id

更新対象メッセージのdatastore entity ID

#### ns

datastoreのnamespace

#### talk

更新するメッセージの新しい `talk` の値

### original_msg

更新元となるオリジナルのメッセージオブジェクト

### 返り値

更新結果のdatastoreの戻り値をresolveするPromise

## getMessageKeyByOpMid

```
getMessageKeyByOpMid(ns, op_mid)
```

### Synopsis

メッセージを `op_mid` で検索し、最初のエントリのキーを返す

### 引数

#### ns

datastoreのnamespace

#### op_mid

検索するメッセージのop_mid

### 返り値

検索結果の最初のエントリの *キー*

## updateMessage

```
updateMessageForOpMid(id, ns, op_mid, original_msg)
```

### Synopsis

メッセージのop_midを更新する。

### NOTE

updateとついているが、この関数は基本的にcreating sequenceの中で呼ばれることを想定している。

OP上のメッセージの値である `op_mid` は、O2Cのメッセージであればpostの段階でセットすることができるが、C2Oのメッセージは当然ながらOP上の値である以上持っていない状態である。
OP上でメッセージを追跡する必要がある場合(例えばOP上でのメッセージの削除を反映したい場合)は、OPへメッセージを投げたあとでその値を得る必要がある。

しかし、C2Oの手順は

1. メッセージをdatastoreに登録
2. メッセージIDをpubに投げる
3. subscriberがsubからメッセージIDを取得
4. datastoreからメッセージを取得
5. OPにメッセージを投げる

という手順である。
`op_mid` を得られるのはsubscriberがOPにメッセージを投げた後であり、どうしても最初に登録する段階では `op_mid` をセットすることはできない。

このため、C2Oにおいて最初の登録時に漏れてしまう `op_mid` 値を補完するための関数であり、そのためこの関数を呼ぶと `uflg` の値は `false` になる。( `postMessage` と同じ扱い)

もし `op_mid` の値が変化することを想定する場合は、この関数は改修しなければならない。 (現時点ではそのような想定ではない)

### 引数

#### id

更新対象メッセージのdatastore entity ID

#### ns

datastoreのnamespace

#### op_mid

メッセージにセットする `op_mid` の値

### original_msg

更新元となるオリジナルのメッセージオブジェクト

### 返り値

更新結果のdatastoreの戻り値をresolveするPromise

