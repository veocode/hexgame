db.createUser({
    user: 'hexgame',
    pwd: 'hexgamemongopassword',
    roles: [{
        role: 'readWrite',
        db: 'hexgame'
    }]
});
