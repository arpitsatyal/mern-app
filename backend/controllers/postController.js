let Post = require('../models/Post')
let User = require('../models/User')
let { deleteImage } = require('../utils/Image')

//for unauthenticated 
exports.posts = async (req, res, next) => {
    try {
        let posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('postedBy', 'name photo')
            .populate('comments.postedBy', 'name photo')
        res.status(200).json(posts)
    } catch (e) {
        next({ msg: e })
    }
}

//for authenticated
exports.postByUser = async (req, res, next) => {
    try {
        let user = await User.findById(req.user._id)
        let usersFollowing = user.following
        let currentPage = req.query.page || 1
        let perPage = 3
        let posts 
        if(!req.admin) {
            posts = await Post.find({ postedBy: { $in: [...usersFollowing, req.user._id] } })
            .skip((currentPage - 1) * perPage)
            .limit(perPage)
            .populate('postedBy', 'name photo')
            .populate('comments.postedBy', 'name photo')
            .sort({ createdAt: -1 })
        } else {
            posts = await Post.find({})
            .skip((currentPage - 1) * perPage)
            .limit(perPage)
            .populate('postedBy', 'name photo')
            .populate('comments.postedBy', 'name photo')
            .sort({ createdAt: -1 })
        }
        res.status(200).json({ posts })
    } catch (e) {
        console.log(e)
        next({ msg: e })
    }
}

exports.getOnePost = async (req, res, next) => {
    try {
        let post = await Post.findById(req.params.id)
            .populate('postedBy', 'name photo')
            .populate('comments.postedBy', 'name photo')

        res.status(200).json({ post })
    } catch (e) {
        next({ msg: e })
    }
}

exports.totalPosts = async (req, res, next) => {
   try {
    let total = await Post.estimatedDocumentCount()
    res.status(200).json(total)
   } catch(e) {
       next({ msg: e })
   }
}

exports.createPost = async (req, res, next) => {
    try {
        if (!req.body.content.length) {
            return next({ msg: 'content is required.' })
        }
        let newPost = await Post.create({
            content: req.body.content,
            postedBy: req.user._id,
            image: {
                url: req.body.image.url,
                public_id: req.body.image.public_id
            }
        })
        let postWithUser = await Post.findById(newPost._id)
        .populate('postedBy', '-password -secret')
        res.status(200).json({ msg: 'post created.', postWithUser })
    } catch (e) {
        next({ msg: e })
    }
}

exports.canEditDelete = async (req, res, next) => {
    try {
        if(req.user.role === 'Admin') return next()
        let post = await Post.findById(req.params.id)
        if (post.postedBy.toString() !== req.user._id.toString()) return next({
            msg: 'NOT Authorized', status: 401
        })
    } catch (e) { next({ msg: e }) }
    next()
}

exports.editPost = async (req, res, next) => {
    try {
        let post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true })
        res.status(200).json({ post })
    } catch (e) {
        next({ msg: e })
    }
}

exports.deletePost = async (req, res, next) => {
    try {
        let post = await Post.findByIdAndDelete(req.params.id)
        if (post.hasOwnProperty('image')) {
            deleteImage(post.image)
        }
        res.status(200).json({ ok: true })
    } catch (e) {
        next({ msg: e })
    }
}

exports.like = async (req, res, next) => {
    try {
        let post = await Post.updateOne({ _id: req.body.post._id, likes: { $nin: req.user._id } }, {
            $push: {
                likes: req.user._id
            },
            $inc: { noOfLikes: 1 }
        }, { new: true })

        res.status(200).json({ post, ok: true })
    } catch (e) {
        next({ msg: e })
    }
}

exports.unlike = async (req, res, next) => {
    try {
        let post = await Post.updateOne({ _id: req.body.post._id }, {
            $pull: {
                likes: req.user._id
            },
            $inc: { noOfLikes: -1 }
        }, { new: true })

        res.status(200).json({ post })
    } catch (e) {
        next({ msg: e })
    }
}

exports.addComment = async (req, res, next) => {
    console.log(req.body)
    try {
        let post = await Post.updateOne({_id: req.body.postId }, {
            $push: {
                comments: {
                    comment: req.body.comment,
                    postedBy: req.user._id
                }
            }
        }, { new: true })
            .populate('postedBy', 'name photo')
            .populate('comments.postedBy', 'name photo')

        res.status(200).json({ post })
    } catch (e) {
        next({ msg: e })
    }
}

exports.removeComment = async (req, res, next) => {
    try {
        let post = await Post.findByIdAndUpdate(req.params.postId, {
            $pull: {
                comments: {
                    _id: req.params.id
                }
            }
        }, { new: true })
        res.status(200).json({ post })
    } catch (e) {
        next({ msg: e })
    }
}