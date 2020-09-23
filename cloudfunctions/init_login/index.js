// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 查询user表内 是否存在该用户信息
    let userExist = await db.collection('user').where({
      _openid: wxContext.OPENID
    }).get()
    .then(res => {
      if (res.errMsg === 'collection.get:ok') {
        return res.data
      }
    });

    // 如果不存在新增用户信息
    let userAdd = null;
    let userTelExist = null;
    if (!userExist.length) {
      userAdd = await db.collection('user').add({
        data: {
          '_openid': wxContext.OPENID,
          'create_time': db.serverDate()
        }
      })
      return {
        ret: 'OK',
        msg: '新增用户成功'
      };
    }

    // 如果用户已经存在 检查手机号是否存在
    let _id = userExist[0]._id
    userTelExist = await db.collection('user')
    .where({
      _id,
      tel: _.exists(true)
    })
    .get()
    .then(res => {
      if (res.errMsg === 'collection.get:ok') {
        return res.data
      }
    });
    if (userTelExist.length) {
      return {
        ret: 'ERROR',
        msg: '该手机号已存在'
      };
    }

    // 绑定手机号 与 openid
    if (!(/^1[3456789]\d{9}$/.test(event.tel))) {
      return {
        ret: 'ERROR',
        msg: '请输入正确手机号码格式'
      }
    }
    let bindTel = await db.collection('user')
      .where({
        _openid: wxContext.OPENID
      })
      .update({
        data: {
          tel: event.tel
        },
      })
      .then(res => {
        return res
      })
    // 判断手机号是否已经绑定
    if (bindTel.stats.updated) {
      return {
        ret: 'OK',
        msg: '绑定手机号成功'
      };
    }
  } catch (error) {
    console.error(error);
    return error;
  }

  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}
