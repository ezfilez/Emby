﻿var LoginPage = {

    onPageShow: function () {
        Dashboard.showLoadingMsg();

        var promise1 = ApiClient.getUsers({ IsHidden: false });
        var promise2 = ApiClient.getServerConfiguration();

        $.when(promise1, promise2).done(function (response1, response2) {

            var users = response1[0];
            var config = response2[0];

            var showManualForm = config.ManualLoginClients.filter(function (i) {

                return i == "Mobile";

            }).length || !users.length;

            showManualForm &= window.location.toString().toLowerCase().indexOf('localhost') == -1;

            if (showManualForm) {

                $('#divUsers', '#loginPage').hide();
                $('#manualLoginForm', '#loginPage').show();

            } else {

                $('#divUsers', '#loginPage').show();
                $('#manualLoginForm', '#loginPage').hide();

                LoginPage.loadUserList(users);
            }

            Dashboard.hideLoadingMsg();
        });
    },

    getLastSeenText: function (lastActivityDate) {

        if (!lastActivityDate) {
            return "";
        }

        return "Last seen " + humane_date(lastActivityDate);
    },

    getImagePath: function (user) {

        if (!user.PrimaryImageTag) {
            return "css/images/logindefault.png";
        }

        return ApiClient.getUserImageUrl(user.Id, {
            width: 240,
            tag: user.PrimaryImageTag,
            type: "Primary"
        });
    },

    authenticateUserLink: function (link) {

        LoginPage.authenticateUser(link.getAttribute('data-username'), link.getAttribute('data-userid'));
    },

    authenticateUser: function (username, password) {

        Dashboard.showLoadingMsg();

        ApiClient.authenticateUserByName(username, password).done(function (result) {

            Dashboard.setCurrentUser(result.User.Id);

            window.location = "index.html?u=" + result.User.Id;

        }).fail(function () {

            $('#pw', '#loginPage').val('');

            Dashboard.hideLoadingMsg();

            setTimeout(function () {
                Dashboard.showError("Invalid user or password.");
            }, 300);
        });
    },

    loadUserList: function (users) {
        var html = "";

        for (var i = 0, length = users.length; i < length; i++) {
            var user = users[i];

            var linkId = "lnkUser" + i;

            if (user.HasPassword) {
                html += "<a class='posterItem squarePosterItem' id='" + linkId + "' data-username='" + user.Name + "' href='#popupLogin' data-rel='popup' onclick='LoginPage.authenticatingLinkId=this.id;' \">";
            } else {
                html += "<a class='posterItem squarePosterItem' id='" + linkId + "' data-username='" + user.Name + "' href='#' onclick='LoginPage.authenticateUserLink(this);' \">";
            }

            if (user.PrimaryImageTag) {

                var imgUrl = ApiClient.getUserImageUrl(user.Id, {
                    width: 500,
                    tag: user.PrimaryImageTag,
                    type: "Primary"
                });

                html += '<div class="posterItemImage" style="background-image:url(\'' + imgUrl + '\');"></div>';
            }
            else {

                var background = LibraryBrowser.getMetroColor(user.Id);

                html += '<div class="posterItemImage" style="background-color:' + background + ';"></div>';
            }

            html += '<div class="posterItemText">' + user.Name + '</div>';

            html += '<div class="posterItemText">';
            var lastSeen = LoginPage.getLastSeenText(user.LastActivityDate);
            if (lastSeen != "") {
                html += lastSeen;
            }
            else {
                html += "&nbsp;";
            }
            html += '</div>';

            html += '</a>';
        }

        $('#divUsers', '#loginPage').html(html);

    },

    onSubmit: function () {

        $('#popupLogin', '#loginPage').popup('close');

        var link = $('#' + LoginPage.authenticatingLinkId)[0];

        LoginPage.authenticateUser(link.getAttribute('data-username'), $('#pw', '#loginPage').val());

        // Disable default form submission
        return false;
    },

    onManualSubmit: function () {

        LoginPage.authenticateUser($('#txtManualName', '#loginPage').val(), $('#txtManualPassword', '#loginPage').val());

        // Disable default form submission
        return false;
    }
};

$(document).on('pageshow', "#loginPage", LoginPage.onPageShow);
