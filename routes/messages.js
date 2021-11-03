const Router = require("express").Router;
const Message = require("../models/message");
const {ensureLoggedIn} = require("../middleware/auth");
const ExpressError = require("../expressError");

const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        let username = req.user.username;
        let message = await Message.get(req.params.id);

        if(username !== message.from_user.username && username !== message.to_user.username) {
            throw new ExpressError("Not authorized to view message!", 401);
        } else {
            return res.json({message: message});
        }
    } catch(e) {
        return next(e);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        let {to_username, body} = req.body;
        let from_username = req.user.username;
        let message = await Message.create({ to_username, from_username, body });
        
        return res.json({message: message});
    } catch(e) {
        return next(e);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        let message = await Message.get(req.params.id);
        let username = req.user.username;

        if(username !== message.to_user.username) {
            throw new ExpressError("You do not get to read that!", 401);
        } else {
            return res.json({ message: message });
        }
    } catch(e) {
        return next(e);
    }
});

module.exports = router;