# エンドポイント

## `/get/op/lineworks/img`

### 役割

Works mobileから画像を取得する。

このエンドポイントはKeelにしかない。

### パラメータ

#### resourceId

LINE WORKSから送信されるresourceId値。

### レスポンス

`data`として画像データの`Buffer`を持つJSON。

この`Buffer`は`{type: "Buffer", data: [ /* ... */ ]}`に変換される。

## `/post/op/reg/lineworks/bot`

このエンドポイントはBoardingから引き継ぐ。

### パラメータ

なし