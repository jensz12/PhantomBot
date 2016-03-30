/*
 * dashboardPanel.js
 * Drives the Dashboard Panel
 */
(function() {

    var panelStatsEnabled = false;
    var streamOnline = false,
        whisperMode = false,
        responseMode = false,
        meMode = false,
        pauseMode = false;
        toutGraphData = [];
        chatGraphData = [];


    /*
     * @function onMessage
     * This event is generated by the connection (WebSocket) object.
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        // Check for dbkeysresult queries
        if (msgObject['dbkeysresult'] != undefined) {
            if (msgObject['dbkeysresult'].localeCompare('dashboard_highlights') == 0) {
                var htmlStr = "";
                for (var i in msgObject['results']) {
                    var highlightData = msgObject['results'][i]['value'];
                    htmlStr += highlightData + " @ " + msgObject['results'][i]['key'] + "<br>";
                }
                if (htmlStr.length == 0) {
                    $("#showHighlights").html("No Highlights Found");
                } else {
                    $("#showHighlights").html(htmlStr);
                }
            }

            if (msgObject['dbkeysresult'].localeCompare('dashboard_chatCount') == 0) {
                var chatDate = "",
                    chatKey = "",
                    chatCount = "";

                chatGraphData = [];
                for (var i = 0, j = 5; i <= 4; i++, j--) {
                    var dateObj = new Date();
                    chatDate = $.format.date(Date.now() - (i * 24 * 36e5), "MM.dd.yy");
                    chatKey = "chat_" + chatDate;
                    chatCount = "0";
                    for (idx in msgObject['results']) {
                        if (msgObject['results'][idx]['key'].localeCompare(chatKey) == 0) {
                            chatCount = msgObject['results'][idx]['value'];
                            break;
                        }
                    }
                    $("#chatDate-" + i).html("<span class=\"purplePill\">Date: " + chatDate + "</span>");
                    $("#chatCount-" + i).html("<span class=\"bluePill\">Chat Count: " + chatCount + "</span>");
                    chatGraphData.push([ j, chatCount ]);
                }
            }

            if (msgObject['dbkeysresult'].localeCompare('dashboard_modCount') == 0) {
                var modDate = "",
                    modKey = "",
                    modCount = "";

                toutGraphData = [];
                for (var i = 0, j = 5; i <= 4; i++, j--) {
                    var dateObj = new Date();
                    modDate = $.format.date(Date.now() - (i * 24 * 36e5), "MM.dd.yy");
                    modKey = "mod_" + modDate;
                    modCount = "0";
                    for (idx in msgObject['results']) {
                        if (msgObject['results'][idx]['key'].localeCompare(modKey) == 0) {
                            modCount = msgObject['results'][idx]['value'];
                            break;
                        }
                    }
                    $("#modCount-" + i).html("<span style=\"width: 120px\" class=\"redPill\">Timeouts: " + modCount + "</span>");
                    toutGraphData.push([ j, modCount ]);
                }

            }
            if (toutGraphData.length > 0 && chatGraphData.length > 0) {
                $.plot($("#panelStatsGraph"),
                           [
                               { data: chatGraphData, lines: { show: true }, color: "#4444ff" },
                               { data: toutGraphData, lines: { show: true }, color: "#ff4444" }
                           ],
                           { xaxis: { show: false }, yaxis: { show: false }
                       });
            }
        }

        // Check for dbqueryresult queries
        if (msgObject['dbqueryresult'] != undefined) {
            if (msgObject['dbqueryresult'].localeCompare('dashboard_panelStatsEnabled') == 0) {
                if (msgObject['result']['enabled'].localeCompare('true') == 0) {
                    if (!panelStatsEnabled) {
                        panelStatsEnabled = true;
                        doQuery(); // Run the query again to populate fields.
                    }
                } else {
                    $("#panelStatsEnabled").html("<span>Panel Stats are Disabled</span>");
                }
            }

            if (msgObject['dbqueryresult'].localeCompare('dashboard_streamTitle') == 0) {
                $("#streamTitleInput").attr("placeholder", msgObject['result']['title']).blur();
            }
 
            if (msgObject['dbqueryresult'].localeCompare('dashboard_gameTitle') == 0) {
                $("#gameTitleInput").attr("placeholder", msgObject['result']['game']).blur();
            }
 
            if (msgObject['dbqueryresult'].localeCompare('dashboard_streamOnline') == 0) {
                streamOnline = (msgObject['result']['streamOnline'].localeCompare('true') == 0);
                if (streamOnline) {
                    $("#streamOnline").html("<span class=\"greenPill\">Stream Online</span>");
                } else {
                    $("#streamOnline").html("<span class=\"redPill\">Stream Offline</span>");
                }
            }

            if (msgObject['dbqueryresult'].localeCompare('dashboard_whisperMode') == 0) {
                whisperMode = (msgObject['result']['whisperMode'].localeCompare('true') == 0);
            }
            if (msgObject['dbqueryresult'].localeCompare('dashboard_muteMode') == 0) {
                responseMode = (msgObject['result']['response_@chat'].localeCompare('true') == 0);
            }
            if (msgObject['dbqueryresult'].localeCompare('dashboard_toggleMe') == 0) {
                meMode = (msgObject['result']['response_action'].localeCompare('true') == 0);
            }
            if (msgObject['dbqueryresult'].localeCompare('dashboard_commandsPaused') == 0) {
                pauseMode = (msgObject['result']['commandsPaused'].localeCompare('true') == 0);
            }

            if (whisperMode) {
                $("#whisperModeStatus").html("<span class=\"bluePill\">Whisper Mode</span>");
            } else {
                $("#whisperModeStatus").html("");
            }

            if (meMode) {
                $("#meModeStatus").html("<span class=\"bluePill\">Action (/me) Mode</span>");
            } else {
                $("#meModeStatus").html("");
            }
            if (!responseMode) {
                $("#muteModeStatus").html("<span class=\"redPill\">Mute Mode</span>");
            } else {
                $("#muteModeStatus").html("");
            }

            if (pauseMode) {
                $("#commandPauseStatus").html("<span class=\"redPill\">Commands Paused</span>");
            } else {
                $("#commandPauseStatus").html("");
            }

            if (streamOnline) {
                if (msgObject['dbqueryresult'].localeCompare('dashboard_streamUptime') == 0) {
                    $("#streamUptime").html("<span class=\"bluePill\">Uptime: " + msgObject['result']['streamUptime'] + "</span>");
                }
                if (msgObject['dbqueryresult'].localeCompare('dashboard_viewerCount') == 0) {
                    $("#viewerCount").html("<span class=\"bluePill\">Viewers: " + msgObject['result']['viewerCount'] + "</span>");
                }
            }

        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBQuery("dashboard_streamTitle", "streamInfo", "title");
        sendDBQuery("dashboard_gameTitle", "streamInfo", "game");
        sendDBQuery("dashboard_whisperMode", "settings", "whisperMode"); 
        sendDBQuery("dashboard_muteMode", "settings", "response_@chat");
        sendDBQuery("dashboard_toggleMe", "settings", "response_action");
        sendDBQuery("dashboard_commandsPaused", "commandPause", "commandsPaused");
        sendDBKeys("dashboard_highlights", "highlights");

        if (!panelStatsEnabled) {
            sendDBQuery("dashboard_panelStatsEnabled", "panelstats", "enabled");
        } else {
            sendDBQuery("dashboard_viewerCount", "panelstats", "viewerCount");
            sendDBQuery("dashboard_streamOnline", "panelstats", "streamOnline");
            sendDBQuery("dashboard_streamUptime", "panelstats", "streamUptime");
            sendDBKeys("dashboard_chatCount", "panelchatstats");
            sendDBKeys("dashboard_modCount", "panelmodstats");
        }
    }

    /**
     * @function toggleCommand
     */
    function toggleCommand(command)
    {
        if (command.localeCompare('pausecommands') == 0) {
            if (pauseMode) {
                command += " clear";
            } else {
                command += " 300";
            }
        }
        sendCommand(command);
        setTimeout(function() { doQuery(); }, 500);
    }

    /**
     * @function setStreamTitle
     */
    function setStreamTitle() {
        var newTitle = $("#streamTitleInput").val();
        if (newTitle.length > 0) {
            sendCommand("title " + newTitle);
            $("#streamTitleInput").val('')
            $("#streamTitleInput").attr("placeholder", newTitle).blur();
        }
    }

    /**
     * @function setGameTitle
     */
    function setGameTitle() {
        var newGame = $("#gameTitleInput").val();
        if (newGame.length > 0) {
            sendCommand("game " + newGame);
            $("#gameTitleInput").val('')
            $("#gameTitleInput").attr("placeholder", newGame).blur();
        }
    }

    /**
     * @function chatReconnect
     */
    function chatReconnect() {
        sendCommand("reconnect");
    }

    /**
     * @function setHighlight
     */
    function setHighlight() {
        $("#showHighlights").html("<i style=\"color: blue\" class=\"fa fa-spinner fa-spin\" />");
        sendCommand("highlight " + $("#highlightInput").val());
        $("#highlightInput").val('');
        setTimeout(function() { sendDBKeys("dashboard_highlights", "highlights"); }, 500);
    }

    /**
     * @function clearHighlights
     */
    function clearHighlights() {
        $("#showHighlights").html("<i style=\"color: blue\" class=\"fa fa-spinner fa-spin\" />");
        sendCommand("clearhighlights");
        setTimeout(function() { sendDBKeys("dashboard_highlights", "highlights"); }, 500);
    }

    /**
     * @function setMultiLink
     */
    function setMultiLink() {
        sendCommand("multi set " + $("#multiLinkInput").val());
    }
    
    /**
     * @function setMultiLinkTimer
     */
    function setMultiLinkTimer() {
        sendCommand("multi timerinterval " + $("#multiLinkTimerInput").val());
    }

    /**
     * @function clearMultiLink
     */
    function clearMultiLink() {
        sendCommand("multi clear");
    }
 
    /**
     * @function multiLinkTimerOn
     */
    function multiLinkTimerOn() {
        sendCommand("multi timer on");
    }
 
    /**
     * @function multiLinkTimerOff
     */
    function multiLinkTimerOff() {
        sendCommand("multi timer off");
    }
 
    // Import the HTML file for this panel.
    $("#dashboardPanel").load("/panel/dashboard.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 0 && isConnected) {
            doQuery();
            clearInterval(interval); 
        }
    }, 200);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 0 && isConnected) {
            newPanelAlert('Refreshing Dashboard Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export functions - Needed when calling from HTML.
    $.dashboardOnMessage = onMessage;
    $.setStreamTitle = setStreamTitle;
    $.setGameTitle = setGameTitle;
    $.chatReconnect = chatReconnect;
    $.setHighlight = setHighlight;
    $.clearHighlights = clearHighlights;
    $.setMultiLink = setMultiLink;
    $.setMuliLinkTimer = setMultiLinkTimer;
    $.clearMultiLink = clearMultiLink;
    $.multiLinkTimerOn = multiLinkTimerOn;
    $.multiLinkTimerOff = multiLinkTimerOff;
    $.toggleCommand = toggleCommand;
})();