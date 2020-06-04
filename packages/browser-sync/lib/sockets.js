"use strict";

var socket = require("socket.io");
var utils = require("./server/utils");

/**
 * Plugin interface
 * @returns {*|function(this:exports)}
 */
module.exports.plugin = function(server, clientEvents, bs) {
    return exports.init(server, clientEvents, bs);
};

/**
 * socket ----> channel_id
 * 记录连接归属的通道
 */
var socketChannelMap = {}
/**
 * channel ----> socket list
 * 记录改连接所有的通道列表
 */
var channelSocketsMap = {}

/**
 * @param {http.Server} server
 * @param clientEvents
 * @param {BrowserSync} bs
 */
module.exports.init = function(server, clientEvents, bs) {
    var emitter = bs.events;

    var socketConfig = bs.options.get("socket").toJS();

    if (
        bs.options.get("mode") === "proxy" &&
        bs.options.getIn(["proxy", "ws"])
    ) {
        server = utils.getServer(null, bs.options).server;
        server.listen(bs.options.getIn(["socket", "port"]));
        bs.registerCleanupTask(function() {
            server.close();
        });
    }

    var socketIoConfig = socketConfig.socketIoOptions;
    socketIoConfig.path = socketConfig.path;

    var io = socket(server, socketIoConfig);

    // Override default namespace.
    io.sockets = io.of(socketConfig.namespace);

    io.set("heartbeat interval", socketConfig.clients.heartbeatTimeout);

    /**
     * Listen for new connections
     */
    io.sockets.on("connection", handleConnection);

    /**
     * Handle each new connection
     * @param {Object} client
     */
    function handleConnection(client) {
        // set ghostmode callbacks
        if (bs.options.get("ghostMode")) {
            addGhostMode(client);
        }

        client.emit("connection", bs.options.toJS()); //todo - trim the amount of options sent to clients

        emitter.emit("client:connected", {
            ua: client.handshake.headers["user-agent"]
        });

        // 如果启用了通道功能，则需要维护通道中的连接信息
        if (bs.options.get("channel") === true) {
            var cookies = client.handshake.headers["cookie"]
            var cidReg = /x-bs-channel-id=[^;\s]+/g
            var cidArr = cookies.match(cidReg)
            var xcid = cidArr && cidArr[0]
            // 如果该连接存在通道标识，则将该连接加入到通道
            if (xcid) {
                var index = 'x-bs-channel-id='.length
                xcid = xcid.substring(index)
                socketChannelMap[client] = xcid
                var sockets = channelSocketsMap[xcid] || []
                sockets.push(client)
                channelSocketsMap[xcid] = sockets
            }

            client.on('disconnect', function() {
                // 连接断开后需要清除连接与通道的映射关系
                var channel = socketChannelMap[client]
                if (channel) {
                    delete socketChannelMap[client]
                    var sockets = channelSocketsMap[channel]
                    var index = sockets.indexOf(client)
                    if (index >= 0) {
                        channelSocketsMap[channel] = sockets.splice(index, 1)
                    }
                }
            })
        }
    }

    /**
     * @param client
     */
    function addGhostMode(client) {
        clientEvents.forEach(addEvent);

        function addEvent(event) {
            client.on(event, (data) => {
                // 如果启用了通道功能，则消息仅发给相同通道中的连接
                if (bs.options.get("channel") === true) {
                    var channel = socketChannelMap[client]
                    // 如果该连接归属某个通道，单独发给该通道中的所有其他连接
                    if (channel) {
                        var sockets = channelSocketsMap[channel]
                        for (var i=0; i<sockets.length; i++) {
                            var socket = sockets[i]
                            if (socket !== client) {
                                try {
                                    socket.emit(event, data)
                                } catch (e) {
                                    // 将异常连接进行移除
                                    delete socketChannelMap[socket]
                                    var index = sockets.indexOf(socket)
                                    if (index >= 0) {
                                        channelSocketsMap[channel] = sockets.splice(index, 1)
                                    }
                                    // 移除一个socket数组元素后，数组元素整体前移
                                    i--
                                }
                            }
                        }
                    }
                }
                // 如果没有启动通道功能，则广播给所有的连接
                else {
                    client.broadcast.emit(event, data);
                }
            });
        }
    }

    return io;
};
