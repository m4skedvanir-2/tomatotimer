const path = require('path');
const express = require('express');

function setupInstallRoutes(expressApp) {
    // インストール用のルート
    expressApp.use(express.static(path.join(__dirname, '../../public')));
    expressApp.get('/',(req, res) => {
        res.sendFile(path.join(__dirname, '../../public/index.html'));
    });
}

module.exports = { setupInstallRoutes };