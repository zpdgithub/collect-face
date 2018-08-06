angular.module('app', [
        'ui.router'
    ])
    .config(['$stateProvider', '$locationProvider', '$urlRouterProvider', function ($stateProvider, $locationProvider, $urlRouterProvider) {
        $locationProvider.html5Mode(false).hashPrefix('');

        $urlRouterProvider.otherwise('/main');
        $stateProvider
            .state('main', {
                url: '/main?userid&cnname&gender', //由url传入id、name
                templateUrl: 'tpl/main.html'
            });
    }])
    .controller('AppController', ['$rootScope', function ($rootScope) {
        $rootScope.apiUrl = '/api/upload'; //采集图片api
        // request: {
        //     userid: 'zhangsan',
        //     base64Img: 9j/4AAQSkZJRgABAQAA...    //图像数据
        // }
        // response:{
        //     photoUrl: 'http://xxx'
        // }
        $rootScope.toUrl = '#'; //确认后，跳转的页面
        $rootScope.showModal = false;
        $rootScope.message = '';
        $rootScope.genders = [{
            id: '0',
            name: '女'
        }, {
            id: '1',
            name: '男'
        }];
    }])
    .controller('MainController', ['$rootScope', '$scope', '$stateParams', '$http', '$timeout', function ($rootScope, $scope, $stateParams, $http, $timeout) {
        function loadCollection() {
            document.createElement("canvas").getContext("2d");

            var compress = function (res, orientation) {
                var img = new Image();
                var maxPixel = 1200;
                img.onload = function () {
                    var degree = 0,
                        drawWidth, drawHeight, width, height;
                    drawWidth = this.naturalWidth;
                    drawHeight = this.naturalHeight;
                    console.log("drawWidth:" + drawWidth);
                    console.log("drawHeight:" + drawHeight);
                    //以下改变一下图片大小
                    var maxSide = Math.max(drawWidth, drawHeight);
                    if (maxSide > maxPixel) {
                        var minSide = Math.min(drawWidth, drawHeight);
                        minSide = minSide / maxSide * maxPixel;
                        maxSide = maxPixel;
                        if (drawWidth > drawHeight) {
                            drawWidth = maxSide;
                            drawHeight = minSide;
                        } else {
                            drawWidth = minSide;
                            drawHeight = maxSide;
                        }
                    }

                    var cvs = document.createElement('canvas');
                    cvs.width = drawWidth;
                    width = drawWidth;
                    cvs.height = drawHeight;
                    height = drawHeight;
                    var ctx = cvs.getContext('2d');

                    //判断图片方向，重置canvas大小，确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
                    switch (orientation) {
                        // iphone横屏拍摄，此时home键在左侧
                        case 3:
                            degree = 180;
                            drawWidth = -width;
                            drawHeight = -height;
                            break;
                            // iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
                        case 6:
                            cvs.width = height;
                            cvs.height = width;
                            degree = 90;
                            drawWidth = width;
                            drawHeight = -height;
                            break;
                            //iphone竖屏拍摄，此时home键在上方
                        case 8:
                            cvs.width = height;
                            cvs.height = width;
                            degree = 270;
                            drawWidth = -width;
                            drawHeight = height;
                            break;
                    }
                    //使用canvas旋转校正
                    ctx.rotate(degree * Math.PI / 180);
                    ctx.drawImage(this, 0, 0, drawWidth, drawHeight);

                    var dataUrl = cvs.toDataURL('image/jpeg', 0.9);
                    dataUrl = dataUrl.substring(dataUrl.indexOf(",") + 1);
                    console.log("=========dataUrl============" + dataUrl);

                    var u = navigator.userAgent;
                    var deviceNo = "browser";
                    if (u.indexOf('Android') > -1 || u.indexOf('Adr') > -1) //android终端
                    {
                        deviceNo = "Android";
                    }
                    if (!!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) //ios终端
                    {
                        deviceNo = "ios";
                    }

                    var data = {
                        id: $scope.id,
                        base64Img: dataUrl
                    };
                    $http.post($rootScope.apiUrl, data).then(function (response) {
                        console.log(response);
                        $rootScope.showModal = true;
                        $rootScope.message = '照片上传成功';
                        $scope.photoUrl = response.data.photoUrl;
                        $timeout(function () {
                            $rootScope.showModal = false;
                            $scope.isToConfirm = true;
                        }, 1000);
                    }, function (e) {
                        console.log('error');
                        $rootScope.showModal = true;
                        $rootScope.message = e;
                        $timeout(function () {
                            $rootScope.showModal = false;
                            // $scope.isToConfirm = true;
                        }, 1000);
                    });
                };

                img.src = res;
            };
            document.getElementById('cameraInput').addEventListener('change', function () {
                if (this.files.length > 0) {
                    var file = this.files[0];
                    var orientation;
                    //EXIF js 可以读取图片的元信息 https://github.com/exif-js/exif-js
                    EXIF.getData(file, function () {
                        orientation = EXIF.getTag(this, 'Orientation');
                    });
                    $rootScope.showModal = true;
                    $rootScope.message = '正在识别，请稍候...';

                    var reader = new FileReader();
                    reader.onload = function (e) {
                        compress(this.result, orientation);
                    };
                    reader.readAsDataURL(file);
                }

            }, false);
        }

        $scope.confirm = function () {
            location.href = $rootScope.toUrl;
        };

        $scope.isToConfirm = false;
        $scope.userid = $stateParams.userid;
        $scope.cnname = $stateParams.cnname;
        $scope.gender = $stateParams.gender;
        loadCollection();
    }]);