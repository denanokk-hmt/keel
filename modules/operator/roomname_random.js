'use strict'

const roomNameSeedUid = [
  "banana",
  "strawberry",
  "cherry",
  "casis",
  "orange",
  "apple",
  "plum"
]

const roomNameSeedRid = [
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "uranys",
  "neptune"
]

/**
 * Create random room name with uid/rid.
 * @param {*} prefix prefix String. ommitable.
 * @param {*} uid use Random number if ommit.
 * @param {*} rid use Random number if ommit
 */
const generateRoomName = (prefix, uid, rid) => {
  if (!prefix) { prefix = ""}
  if (!uid) { uid = Math.floor(Math.random() * 35000) }
  if (!rid) { rid = Math.floor(Math.random() * 35000) }
  let salt = Math.floor(Math.random() * 16)  ** 2
  let uname = roomNameSeedUid[(uid + salt) % 7]
  let rname = roomNameSeedRid[(rid + salt) % 9]

  let date = new Date()

  return `${prefix}${uname}-${rname}-${date.getMonth() + 1}_${date.getDate()}_${date.getHours()}${date.getMinutes()}`
}

module.exports.room = generateRoomName