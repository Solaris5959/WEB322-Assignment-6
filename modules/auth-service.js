const mongoose = require('mongoose');



let Schema = mongoose.Schema;
require('dotenv').config();

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
    },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String,
    }],
  });

  let User;

  module.exports.initialize = function () { 
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err)=>{
            reject(err); 
        });
        db.once('open', ()=>{
            User = db.model('names', userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            let newUser = new User(userData);
            newUser.save()
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    if (err.code === 11000) {
                        reject("User Name already taken");
                    } else {
                        reject("There was an error creating the user: " + err);
                    }
                });
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject("Unable to find user: " + userData.userName);
                } else if (users[0].password !== userData.password) {
                    reject("Incorrect Password for user: " + userData.userName);
                } else {
                    if (users[0].loginHistory.length === 8) {
                        users[0].loginHistory.pop();
                    }
                    users[0].loginHistory.unshift({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                    User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                        .then(() => {
                            resolve(users[0]);
                        })
                        .catch((err) => {
                            reject("There was an error verifying the user: " + err);
                        });
                }
            })
            .catch(() => {
                reject("Unable to find user: " + userData.userName);
            });
    });
};