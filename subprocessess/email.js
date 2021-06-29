const nodemailer = require('nodemailer')
const nmHbs = require('nodemailer-express-handlebars')
const hbs = require('express-handlebars')
const path = require('path')
require('dotenv').config()

const genUID = require('../helpers/genUID')

let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.NOREPLY_USER,
        pass: process.env.NOREPLY_PASS
    }
})
transporter.use('compile', nmHbs({
    viewEngine: hbs.create({
        partialsDir: './partials/',
        layoutsDir: './layouts/',
        defaultLayout: 'inlineStyle'
    }),
    viewPath: path.resolve(__dirname, '../views'),
    extName: '.hbs'
}))

const sendMail = async (template, context, recipient) => {
    return await transporter.sendMail({
        to: recipient,
        subject: 'Test',
        template: template,
        context: context
    })
}

const handleResetPassword = (messageObj) =>new Promise(async (res, rej) => {
    sendMail()
})

module.exports = {
    handleResetPassword: handleResetPassword
}