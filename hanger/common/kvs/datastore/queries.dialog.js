'use strict';

//Datastore
const ds_conf = require('./config_keel');
const store = ds_conf.store;

/**
 * getDialog
 * dflg=falseのDialogを取得する
 * @param {String} ns
 * @returns {Array} response一覧
 */
const getDialog = async (ns) => {
  try {
    store.datastore.namespace = ns;
    const query = store.datastore
      .createQuery([ds_conf.KIND.DIALOG_RESPONSIES])
      .filter('dflg', '=', false);
  
    const results = await store.datastore.runQuery(query);
    console.log(`========= ns: ${ns} =========get dialog /get ${results[0].length} results.`);
    return results[0];
  }
  catch (err) {
    console.error(`========= ns: ${ns} =========failed to get dialog. err: ${JSON.stringify(err)}`);
    throw err;
  }
};
module.exports.getDialog = getDialog;

/**
 * getDialog
 * dflg=trueのDialogを取得する
 * @param {String} ns
 * @returns {Array} response一覧
 */
const getDialogDeleted = async (ns) => {
  try {
    store.datastore.namespace = ns;
    const query = store.datastore
      .createQuery([ds_conf.KIND.DIALOG_RESPONSIES])
      .filter('dflg', '=', true);
  
    const results = await store.datastore.runQuery(query);
    console.log(`========= ns: ${ns} =========get deleted dialog /get ${results[0].length} results.`);
    return results[0];
  }
  catch (err) {
    console.error(`========= ns: ${ns} =========failed to get deleted dialog. err: ${JSON.stringify(err)}`);
    throw err;
  }
};
module.exports.getDialogDeleted = getDialogDeleted;

/**
 * getDialogMessage
 * 指定されたIDのDialogを取得する
 * @param {String} ns
 * @returns {Array} response
 */
const getDialogMessage = async (ns, response_id) => {
  try {
    store.datastore.namespace = ns;
    const query = store.datastore
      .createQuery([ds_conf.KIND.DIALOG_RESPONSIES])
      .filter('response_id', '=', response_id)
      .filter('dflg', '=', false);
  
    const [result] = await store.datastore.runQuery(query);

    if (!result?.[0] || result[0].length > 1) { return null; }

    console.log(`========= ns: ${ns} =========get dialog /get ${result[0].length} results.`);
    return result[0];
  }
  catch (err) {
    console.error(`========= ns: ${ns} =========failed to get dialog by key:${response_id}. err: ${JSON.stringify(err)}`);
    throw err;
  }
};
module.exports.getDialogMessage = getDialogMessage;

/**
 * getDialogHeads
 * head=trueのDialogを取得する
 * @param {String} ns
 * @returns {Array} response一覧
 */
const getDialogHeads = async (ns) => {
  try {
    store.datastore.namespace = ns;
    const query = store.datastore
      .createQuery(ds_conf.KIND.DIALOG_RESPONSIES)
      .filter('dflg', '=', false)
      .filter('head', '=', true);
  
    const results = await store.datastore.runQuery(query);
    console.log(`========= ns: ${ns} =========get dialog heads /get ${results[0].length} results.`);
    return results[0];
  }
  catch (err) {
    console.error(`========= ns: ${ns} =========failed to get dialog heads. err: ${JSON.stringify(err)}`);
    throw err;
  }
};
module.exports.getDialogHeads = getDialogHeads;

/**
 * updateDialog
 * DialogのResponsesをupsertする
 * @param {String} ns
 * @param {object} data
 * @param {String} client
 * @param {String} comment
 * @param {String} log_id
 */
const updateDialog = async (ns, client, data) => {

  const dt = new Date();
  console.log(`=========ns: ${ns} =========update dialog.`);

  try {
    const tran = store.datastore.transaction();

    const tranKey = tran.datastore.key({
      namespace: ns,
      path: [
        ds_conf.KIND.DIALOG_MASTER,
        ds_conf.KIND.DIALOG_MASTER,
      ]
    });
    const [search] = await tran.get(tranKey);
    // insert dialog master
    tran.upsert({
      key: tranKey,
      data: [
        {
          name: "udt",
          value: dt
        },{
          name: "cdt",
          value: search?.cdt || dt
        },
      ]
    });

    //insert dialog
    const inputData = data.map(row => {
      return {
        key: store.datastore.key({
          namespace: ns,
          path: [
            ds_conf.KIND.DIALOG_RESPONSIES,
            row?.response_id,
          ]
        }),
        data: [
          {
            name: "response_id",
            value: row?.response_id
          },
          {
            name: "client",
            value: client
          },
          {
            name: "head",
            value: row?.head || false
          },
          {
            name: "title",
            value: row?.title || null
          },
          {
            name: "talk",
            value: row?.talk || null,
            excludeFromIndexes: true,
          },
          {
            name: "dflg",
            value: row?.dflg || false
          },
          {
            name: "cdt",
            value: row?.cdt || dt
          },
          {
            name: "udt",
            value: dt
          },
          {
            name: "committer",
            value: row?.committer || null
          },
        ]
      }
    }
    )
    await store.datastore.upsert(inputData);

    await tran.commit();
    console.log(`========= ns: ${ns} =========success insert ${data.length} responsies for dialog.`);

    return;
  } catch (err) {
    const err_msg = err.message || err;
    console.error(`========= ns: ${ns} =========failed insert responsies for dialog. /err: ${JSON.stringify(err_msg)}`);
    throw err;
  }
};
module.exports.updateDialog = updateDialog;

/**
 * deleteDialog
 * 指定されたmessageのエンティティを物理削除する
 * @param {String} ns
 * @param {Object} messages
 */
const deleteDialog = async (ns, messages) => {

  const dt = new Date();
  console.log(`=========ns: ${ns} =========update dialog.`);

  try {
    const tran = store.datastore.transaction();

    const tranKey = tran.datastore.key({
      namespace: ns,
      path: [
        ds_conf.KIND.DIALOG_MASTER,
        ds_conf.KIND.DIALOG_MASTER,
      ]
    });
    const [search] = await tran.get(tranKey);
    // insert dialog master
    tran.upsert({
      key: tranKey,
      data: [
        {
          name: "udt",
          value: dt
        },{
          name: "cdt",
          value: search?.cdt || dt
        },
      ]
    });

    //delete dialog
    const target = messages.map(message => store.datastore.key({
      namespace: ns,
      path: [
        ds_conf.KIND.DIALOG_RESPONSIES,
        message?.response_id
      ],
    }))
    const result = await store.datastore.delete(target)

    await tran.commit();
    const deleted = result[0]?.mutationResults?.length || 0
    console.log(`========= ns: ${ns} =========success delete ${deleted} responsies from dialog.`);

    return deleted;
  } catch (err) {
    const err_msg = err.message || err;
    console.error(`========= ns: ${ns} =========failed delete responsies from dialog. /err: ${JSON.stringify(err_msg)}`);
    throw err;
  }
};
module.exports.deleteDialog = deleteDialog;
