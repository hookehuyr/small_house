// 云函数入口文件
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const dayjs = require('dayjs');

/**
 * 安全验收标准
 * 验证码为4位纯数字
 * 每个手机号60秒内只能发送1次短信验证码，且正则则的校验必须在服务器端
*/

// 生成验证码
function generateMixed(n) {
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let code = '';
  for (let index = 0; index < n; index++) {
    let id = Math.ceil(Math.random() * 9);
    code += chars[id];
  }
  return code;
}

/**
 * 检查手机号格式
 * 检查验证码规则
*/
function validTelAndInterval(tel) {
  // 手机号格式校验
  // if (!(/^1[3456789]\d{9}$/.test(tel))) {
  //   return {
  //     ret: 'ERROR',
  //     msg: '手机号格式有误',
  //     content: ''
  //   };
  // }
  // 查询 sms 表内 是否发送过验证码
  return db.collection('sms').where({
    tel
  }).get()
  .then(res => {
    // 手机号码存在 说明验证码已发送
    if (res.data.length) {
      // 验证码生成时间
      let create_time = dayjs(res.data[0].create_time).valueOf();
      let server_time = dayjs().valueOf();
      // 是否大于一分钟
      if ((server_time - create_time) > 60 * 1000) {
        return {
          ret: 'OK',
          msg: '可以发送验证码',
          content: res.data[0].tel
        };
      } else {
        return {
          ret: 'ERROR',
          msg: '发送间隔不能小于1分钟',
          content: ''
        };
      }
    } else {
      return {
        ret: 'OK',
        msg: '该手机号未发送过验证码',
        content: ''
      };
    }
  })
  .catch(error => {
    console.warn(error);
    return error;
  });
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  // 发送前校验手机号相关信息
  let valid_result = await validTelAndInterval(event.tel);
  if (valid_result.ret !== 'OK') return valid_result;

  // 发送短信类库
  const QcloudSms = require('qcloudsms_js');

  let appid = '1400429925'; // AppID是短信应用的唯一标识
  let appkey = 'c5634428412768c198e4ff473d148d5f'; // AppKey是用来校验短信发送合法性的秘钥
  let templateid = '730182'; // 短信模板ID
  let smsSign = '三見民宿助手'; // 设置的短信签名

  // 实例化QcloudSms
  let qcloudsms = QcloudSms(appid, appkey);
  let ssender = qcloudsms.SmsSingleSender();
  let params = [generateMixed(4)]; // 生成的验证码

  // API处理发送验证码
  let send_sms = new Promise((resolve, reject) => {
    ssender.sendWithParam(
      86, // 区号
      event.tel, // 要发送的手机号
      templateid, // 短信模板
      params, // 要发送的验证码
      smsSign, // 签名
      '', '',
      (err, res, { result, errmsg }) => {
        if (err) {
          reject(err);
        } else {
          // 发送成功 result = 0
          if (!result) {
            resolve({
              ret: 'OK',
              msg: '发送成功',
              content: result
            });
          } else {
            resolve({
              ret: 'ERROR',
              msg: '发送失败',
              content: result
            });
          }
        }
      });
  });

  // 处理发送验证码逻辑
  return send_sms
  .then(res => {
    // 短信发送成功
    if (!res.content) {
      // 验证码存在
      if (valid_result.content) {
        // 已发送验证码 更新验证码和创建时间
        return db.collection('sms')
        .where({
          tel: event.tel,
        })
        .update({
          data: {
            'sms': params[0],
            'create_time': db.serverDate()
          }
        })
        .then(res => {
          return {
            ret: 'OK',
            msg: '更新成功',
            content: res
          };
        })
        .catch(error => {
          console.error(error);
          return error;
        });
      } else {
        // 手机号未发送验证码 新增验证码和创建时间
        return db.collection('sms').add({
          data: {
            '_openid': wxContext.OPENID,
            'tel': event.tel,
            'sms': params[0],
            'create_time': db.serverDate()
          }
        })
        .then(res => {
          return {
            ret: 'OK',
            msg: '新增成功',
            content: res
          };
        })
        .catch(error => {
          console.error(error);
          return error;
        });
      }
    } else {
      // 错误码翻译标示
      switch (res.content) {
        case 1024:
          return {
            ret: 'ERROR',
            msg: '单个手机号1小时内下发短信条数超过设定的上限',
            content: res
          };
        case 1016:
          return {
            ret: 'ERROR',
            msg: '手机号格式错误',
            content: res
          };
        default:
          return res;
      }
    }
  })
  .catch(error => {
    console.error(error);
  });
};
