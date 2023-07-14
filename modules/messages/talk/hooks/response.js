const response = (messages, uuid, user_id) => {
  // setting date
  const talks = messages || [];
  const dt = new Date();
  return {
    btalk_type: "bot",
    btalk: {
      type: "API",
      status_code: 0,
      status_msg: "Success.",
      qty: talks.length,
      messages: talks.map((talk, index) => {
        return {
        // customerのmtimeと被ってhistoryの順番が前後で入れ替わってしまう場合があるためnew dateに+3をする
        // また、このmessages内でも前後を保つために+indexをする
        mtime: dt.getTime() + 3 + index,
        mtype: 'bot',
        talk: talk,
        response_context: {
          response_context: "",
          uuid: uuid,
          conversation_id: null,
          metadata: {
            user_id: user_id
          }
        },
        cdt: dt,
      }}),
      newest: null
    }
  };
};
module.exports = response;
