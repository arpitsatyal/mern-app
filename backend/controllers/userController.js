let User = require('../models/User')
let mapUser = require('../utils/mapUser')
let { validateUpdate } = require('../utils/validateUser')

exports.fetchUser = async (req, res, next) => {
    try {
        let user = await User.findOne({ username: req.params.username })
        .select('-password -secret')
        res.status(200).json({ user })
    } catch (e) {
        next({ msg: e })
    }
}

exports.updateProfile = async (req, res, next) => {
    try {
        let toUpdate = {}
        mapUser(toUpdate, req.body, false)
        let isValid = validateUpdate(toUpdate)
        if (isValid) return next({ msg: isValid })
        if (req.body.image) {
            toUpdate.photo = {
                url: req.body.image.url,
                public_id: req.body.image.public_id
            }
        }
        let updatedUser = await User.findByIdAndUpdate(req.user._id, { ...toUpdate }, { new: true })

        updatedUser.password = undefined
        updatedUser.secret = undefined

        res.status(200).json({ updatedUser })

    } catch (e) {
        if (e.code === 11000) {
            return next({ msg: 'duplicate user!' })
        }
        next({ msg: e })
    }
}

exports.findPeople = async (req, res, next) => {
    try {
        let user = await User.findById(req.user._id)
        let following = user.following
        // $nin returns those ids that are not in the following array
        let people = await User.find({ _id: { $nin: following, $ne: req.user._id } })
        res.status(200).json({ people })
    } catch (e) {
        next({ msg: e })
    }
}

exports.follow = async (req, res, next) => {
    try {
        let user = await User.findByIdAndUpdate(req.user._id, {
            //addToSet is same as push, but avoids duplicates
            $addToSet: {
                following: req.body._id
            }
        }, { new: true })
            .select('-password -secret')

        await User.findByIdAndUpdate(req.body._id, {
            $addToSet: {
                followers: req.user._id
            }
        })
        res.status(200).json({ user })
    } catch (e) {
        next({ msg: e })
    }
}

exports.unfollow = async (req, res, next) => {
    try {
        let user = await User.findByIdAndUpdate(req.user._id, {
            $pull: {
                following: req.body._id
            }
        }, { new: true })
            .select('-password -secret')

        await User.findByIdAndUpdate(req.body._id, {
            $pull: {
                followers: req.user._id
            }
        })
        res.status(200).json({ user })
    } catch (e) {
        next({ msg: e })
    }
}

exports.userFollowing = async (req, res, next) => {
    try {
        let user = await User.findById(req.user._id)
        let following = await User.find({ _id: user.following })
            .select('-password -secret')
        res.status(200).json({ following })
    } catch (e) {
        next({ msg: e })
    }
}


exports.searchUser = async (req, res, next) => {
    let { query } = req.query
    if(!query) return;
    try {
        // i is used to perform case insensetive matching
        let searchResult = await User.find({ 
            $or: [
                {
                    name: { $regex: query, $options: 'i'}
                }, 
                {
                    username: { $regex: query, $options: 'i' }
                }
            ]
         })
         .select('-password -secret')
        if(!searchResult.length) return res.status(400).json({ msg: 'No result found.'})
        res.status(200).json(searchResult)
    } catch (e) {
        next({ msg: e })
    }
}