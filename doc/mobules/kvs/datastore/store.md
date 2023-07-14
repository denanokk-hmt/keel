# Synopsis

datastoreにアクセスを行うモジュール。

# モジュールメソッド

## putEntity

## updateEntity

## deleteEntity

## getByAncestorKey

## getEntityByKey

```
getEntityByKey(ns, kind, key, customNm)
```

### 引数

#### ns

datastoreのnamespace値。

#### kind

`Datastore#createQuery`に渡されるkind値。

#### key

datastoreのkey。

#### customNm (Boolian)

真の場合、`key`を文字列として扱い、偽であれば`key`を数値として扱う。

### 戻り値

`datastore.runQeury`によって得られた値。

### 例外

このメソッドは`datastore.runQuery`で発生した例外を捕捉した上で再度投げる。

# モジュールプロパティ

## datastore

`Datastore`オブジェクト

