const nodemailer = require('nodemailer')
const nmHbs = require('nodemailer-express-handlebars')
const hbs = require('express-handlebars')
const path = require('path')
require('dotenv').config()

const genUID = require('../helpers/genUID')
const UserModel = require('../models/user')
const TempUIDModel = require('../models/tempUID')

let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.NOREPLY_USER,
        pass: process.env.NOREPLY_PASS
    }
})
transporter.use('compile', nmHbs({
    viewEngine: hbs.create({
        layoutsDir: path.resolve(__dirname, '../views/layouts'),
        partialsDir: path.resolve(__dirname, '../views/partials/'),
        defaultLayout: 'inlineStyle',
        extname: '.hbs'
    }),
    viewPath: path.resolve(__dirname, '../views'),
    extName: '.hbs'
}))

const sendMail = async (template, recipient, subject, context) => {
    console.log(`[SendMail] Sending email to ${recipient} using the ${template} template.`)
    return await transporter.sendMail({
        from: process.env.NOREPLY_USER,
        to: recipient,
        subject: subject,
        template: template,
        context: context
    })
}

const handleResetPassword = (messageObj) => new Promise(async (res, rej) => {
    const user = await UserModel.findOne({ email: messageObj.content }).lean()
    if (!user) {
        await sendMail('passwordResetInvalid', messageObj.content, 'Password Reset Notification', {})
        return res()
    }
    const resetUID = genUID()
    try {
        // Potential vulnerability: updating with same tempId as before will not trigger the 11000 error, making URLs employing this ID less secure. 
        await TempUIDModel.findByIdAndUpdate(user._id, { tempId: resetUID, created: Date.now() }, { upsert: true })
    } catch (ex) {
        if (ex.code == 11000) { // Duplicate key (tempId)
            // The probability of this is very low, so a stack overflow is practically impossible
            handleResetPassword(messageObj).then(() => res()).catch(err => rej(err))
            return // Kinda funky: return from function but still block, wait for res or rej in handleResetPassword cb
        } else {
            console.error(ex)
            return rej('Error in UID update')
        }
    }
    await sendMail('passwordResetValid', user.email, 'Password Reset Notification', {
        uid: resetUID,
        username: user.username
    })
    res()
})

module.exports = {
    handleResetPassword: handleResetPassword
}