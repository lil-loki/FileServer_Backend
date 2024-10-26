const authenticator = function (req, res, next) {
    if (req.session && req.session.username) {
        next();
    } else {
        res.status(401);
        res.send({ message: "Unauthorized" });
    }
}

module.exports = authenticator;