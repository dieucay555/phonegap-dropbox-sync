var app = (function() {

    var w = $("#content").width(),
        h = $("#content").height(),
        localFileFullPath = '';

    var listFolder = function() {
        var i,
            l,
            html = "",
            file;
        dropbox.listFolder(app.path).done(function (files) {
            l = files.length;
            if (l > 0) {
                $("#noFiles").hide();
            } else {
                $("#noFiles").show();
            }
            for (i=0; i<l; i++) {
                file = files[i];
              if (file.isFolder) {
                   html += '<li fo="fo" class="topcoat-list__item">' +
                   '<a href="#' + encodeURIComponent(file.path) + '" class="folder">' +
                   '<img src="img/icon-folder.png" />' +
                    file.path.substr(file.path.lastIndexOf("/") + 1)  + '</a></li>';
              } else {
                   html += '<li fi="fi" class="topcoat-list__item">' +
                   '<a href="#' + encodeURIComponent(file.path) + '" class="file">' +
                   '<img src="img/icon-file.png" />' +
                   file.path.substr(file.path.lastIndexOf("/") + 1)  + '</a></li>';
              }
            }
            $("#fileList").html(html);
            //sort the list now
            var fileList = $('#fileList');
            var folderItems = fileList.children('li[fo="fo"]').get();
            var fileItems = fileList.children('li[fi="fi"]').get();
            fileList.html('');
            sortAndAppendList(folderItems, fileList);
            sortAndAppendList(fileItems, fileList);
        });
    }
    
    var showWelcomeView = function() {
        hideAllViews();
        $('#appHeaderText').html('PhoneGap Sync');
        $('#btn-back').hide();
        $("#fileList").empty();
        $("#filePath").html("&nbsp;");
        $("#image").attr("src", "");
        $("#text").html("");
        $("#welcomeView").show();
    }

    var showDropboxView = function() {
        hideAllViews();
        $('#appHeaderText').html('<span style="font-size:14px;position:absolute;left:-30px;">Dropbox Apps Folder</span>');
        $('#loader').css('left', '60px');
        $("#dropboxView, #btn-back").show();
        app.path = "/";
        app.listFolder();
        dropbox.addObserver("/");
    }
    
    var showFileUploadView = function() {
       hideAllViews();
       $('#appHeaderText').html('<span style="font-size:14px;">Tap &amp; hold a file/folder to upload</span>');
       $('#loader').css('left', '70px');
       $('#fileUploadView').show();
       if (localFileFullPath == ''){
          // request the persistent file system
          window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, getFSRoot, FSfail);
       }
    }
    
    var hideAllViews = function() {
       $("#welcomeView, #dropboxView, #fileUploadView").hide();
    }

    $('#image').css({'max-width':w, 'max-height':h});

    $("#btn-link").on("click", function() {
        dropbox.link();
        event.preventDefault();
    });

    $("#btn-unlink").on("click", function() {
        showConfirm('Unlink from Dropbox?', 'Confirm Unlink', ['Yes', 'No'], function(buttonIndex) {
           if (buttonIndex == 1) {
              showLoader();
              dropbox.unlink().done(function() {
                hideLoader();
                showWelcomeView();
              });
           }
        });
        event.preventDefault();
    });

    $("#btn-back").on("click", function(event) {
        if ($('#fileUploadView').is(':visible')) {
           if (localFileFullPath == 'file:///') { // if we're at root
              showConfirm('Go back to Dropbox list?', 'Show Dropbox', ['Yes', 'No'], function(buttonIndex) {
                 if (buttonIndex == 1) {
                    showDropboxView();
                 }
              });
           } else {
              getParentFolder();
           }
        } else if ($('#dropboxView').is(':visible')) {
           if ($('#path').text() == '/') {
              showExitConfirm();
           } else {
              window.history.back();
           }
        } else { // we're on welcomeView
           showExitConfirm();
        }
       function showExitConfirm() {
          showConfirm('Exit PhoneGap Sync?', 'Confirm Exit', ['Exit', 'Cancel'], function(buttonIndex) {
             if (buttonIndex == 1) {
                navigator.app.exitApp(); // close the app
             }
          });
       }
        event.preventDefault();
    });
    
    $('#btn-backToDropboxView').on('click', function(event) {
        showDropboxView();
        event.preventDefault();
    });

    $("#fileList").on("click", ".file", function(event) { // on dropboxView
        var filePath = decodeURIComponent($(event.currentTarget).attr("href").substr(1));
        $("#filePath").html(filePath);
        showLoader();
        if( (/\.(gif|jpg|jpeg|tiff|png)$/i).test(filePath) ) {
            dropbox.readData(filePath).done(function(result) {
                var bytes = new Uint8Array(result);
                $('#image').attr('src', "data:image/jpeg;base64," + encode(bytes));
                $("#image").show();
                $("#text").hide();
                hideLoader();
            });
        } else {
            dropbox.readString(filePath).done(function(result) {
                $("#text").html(result);
                $("#image").hide();
                $("#text").show();
                hideLoader();
            });
        }
        event.preventDefault();
    });
    
    $('#btn-uploadFiles').on('click', function(event) { // fileUploadView
       showFileUploadView();
       event.preventDefault();
    });
    
    $('#localFileList').on('click', 'a[href="#localFile"]', function(event) { // fileUploadView
       if (! $(this).hasClass('file')) {
           localFileFullPath = $(this).attr('fullPath');
           getFolderWithPath();
       }
       event.preventDefault();
    }).on('taphold', 'a[href="#localFile"]', function(event) {
       var uploadPath = $(this).attr('fullPath');
       var fileName = $(this).attr('fileName');
       if ($(this).hasClass('file')) {
          showConfirm('Upload ' + fileName + ' to Dropbox?', 'Confirm File Upload', ['Yes', 'No'], function(buttonIndex) {
             if (buttonIndex == 1) {
                 showLoader();
                 dropbox.uploadFile(uploadPath).done(function(result) {
                    hideLoader();
                 }).fail(function(err) {
                    console.log('dropbox.uploadFile fail, err -> ' + err);
                    hideLoader();
                 });
             }
          });
       } else {
          showConfirm('Upload ' + fileName + ' folder to Dropbox?', 'Confirm Folder Upload', ['Yes', 'No'], function(buttonIndex) {
             if (buttonIndex == 1) {
                showLoader();
                 dropbox.uploadFolder(uploadPath).done(function(result) {
                    hideLoader();
                 }).fail(function(err) {
                    console.log('dropbox.uploadFolder fail, err -> ' + err);
                    hideLoader();
                 });
             }
          });
       }
       event.preventDefault();
    });

    $(window).on('hashchange', function() {
        app.path = decodeURIComponent(window.location.hash.substr(1));
        $("#path").html(app.path ? app.path : "/");
        listFolder();
    });
    
    $(window).on('orientationchange', function(event) {
       setTimeout(function() {
           h = $('#content').height();
           w = $('#content').width();
           $('#image').css({'max-width':w, 'max-height':h});
       }, 300);
       switch(window.orientation) {
         case -90:
         case 90:
            // landscape
            $('#loader').css('left', '90px');
         break; 
         default:
            //portrait
            $('#dropboxView').is(':visible') ? $('#loader').css('left', '60px') : $('#loader').css('left', '70px');
         break; 
      }
    });
    
    document.addEventListener("deviceReady", function() {   // ready for kickoff
        dropbox.checkLink().done(showDropboxView).fail(showWelcomeView);
        
        // hook btn-back to the device's back button
        document.addEventListener('backbutton', onBackKeyDown, false);
        function onBackKeyDown(event) {
           $('#btn-back').trigger('click');
           event.preventDefault();
        }
    });
    
    function sortAndAppendList(items, list) {
       items.sort(function(a, b) {
           return $(a).text().toUpperCase().localeCompare($(b).text().toUpperCase());
        });
       $.each(items, function(idx, itm) { 
          list.append(itm); 
       });
    }
    
    function appendToLocalFileList(entries) {
       var fileCount = entries.length,
       html = '';
       if (fileCount > 0) {
           for (var i = 0; i < fileCount; i++) {
              if (entries[i].isDirectory) {
                 html += '<li fo="fo" class="topcoat-list__item">' + '<a href="#localFile" class="folder" ' +
                 'fullPath="'+ entries[i].fullPath +'" fileName="'+ entries[i].name +'">' +
                 '<img src="img/icon-folder.png" />' +
                  entries[i].name + '</a></li>';
              } else {
                  html += '<li fi="fi" class="topcoat-list__item">' + '<a href="#localFile" class="file" ' +
                  'fullPath="'+ entries[i].fullPath +'" fileName="'+ entries[i].name +'">' +
                  '<img src="img/icon-file.png" />' +
                  entries[i].name + '</a></li>';
              }
          }
          $('#localFileList').html(html);
          //sort the list now
          var localFileList = $('#localFileList');
          var folderItems = localFileList.children('li[fo="fo"]').get();
          var fileItems = localFileList.children('li[fi="fi"]').get();
          localFileList.html('');
          sortAndAppendList(folderItems, localFileList);
          sortAndAppendList(fileItems, localFileList);
       } else {
          html = '<li class="topcoat-list__item" style="padding:5px;">No files found in this directory.</li>';
          $('#localFileList').html(html);
       }
       localFileFullPath != '' ? $('#localPath').text(localFileFullPath) : $('#localPath').text('file:///storage');
    }
    
    // ** local filesystem arithmetic
    function getFSRoot(fileSystem) { // not really root on first run, but you can get to root if you're rooted by clicking back
        window.resolveLocalFileSystemURI("file:///storage", function(dir) {
           localFileFullPath = dir.fullPath;
           var directoryReader = dir.createReader();
           directoryReader.readEntries(readerSuccess,readerFail);
        }, function(err){
           console.log('failed to get /storage directory, error ' + err.code + '\nfalling back to using fileSystem.root.fullPath');
           localFileFullPath = fileSystem.root.fullPath;
           var directoryReader = fileSystem.root.createReader();
           directoryReader.readEntries(readerSuccess,readerFail);
        });
    }

    function getFolderWithPath() {
        window.resolveLocalFileSystemURI(localFileFullPath, function(dir) {
            var directoryReader = dir.createReader();
            directoryReader.readEntries(readerSuccess,readerFail);
        }, function(err){
           console.log("getDirectory error " + err.code);
        });
    }
    
    function getParentFolder() {
       if (localFileFullPath != 'file:///storage/sdcard0' && localFileFullPath != 'file:///storage/sdcard') {
           window.resolveLocalFileSystemURI(localFileFullPath, function(dir) {
               dir.getParent(function(parent) {
                  localFileFullPath = parent.fullPath;
                  var directoryReader = parent.createReader(); // this gives the wrong path when at file:///storage/sdcard
                  directoryReader.readEntries(readerSuccess,readerFail);
               }, function(err){
                  console.log("getParent error " + err.code);
               });
            }, function(err){
               console.log("getDirectory error " + err.code);
            });
       } else {
           window.resolveLocalFileSystemURI('file:///storage', function(dir) {
              localFileFullPath = dir.fullPath;
              var directoryReader = dir.createReader();
              directoryReader.readEntries(readerSuccess,readerFail);
            }, function(err){
              console.log("error getting storage directory, error " + err.code);
            });
       }
    }

    function FSfail(err) {
        console.log("FSfail and error is below");
        console.log(err);
    }

    function readerSuccess(entries) {
        appendToLocalFileList(entries);
    }
            
    function readerFail(error) {
       alert("Failed to list directory contents: " + error.code);
    }
    // **
    
    function showConfirm(message, title, labels, success) {
        navigator.notification.confirm(
            message, // message string
            success, // callback to invoke with index of button pressed
            title,   // title string
            labels   // buttonLabels array
        );
    }
    
    function showLoader() {
        $("#loader").show();
    }
    
    function hideLoader() {
        $("#loader").hide();
    }

    return {
        path:       "/",
        listFolder:   listFolder,
        showDropboxView:   showDropboxView,
        showLoader:      showLoader,
        hideLoader:      hideLoader
    }
    
}());

// Called from onActivityResult in the app's main activity (dropboxAndroidCordova)
function dropbox_linked() {
    app.showDropboxView();
}

//Called by observer in DropboxSync plugin when there's a change to the status of background synchronization (download/upload)
function dropbox_onSyncStatusChange(status) {
    status == 'none' ? app.hideLoader() : app.showLoader();
}

// Called by observer in DropboxSync plugin when a file is changed
function dropbox_fileChange() {
    app.listFolder();
}
