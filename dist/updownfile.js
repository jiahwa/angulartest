(function (window, angular) {
	'use strict';
	angular.module('app').directive('fileupload',
		['$parse', '$http', '$rootScope',
			function ($parse, $http, $rootScope) {
				return {
					restrict: 'EA',
					template: '' +
						'<div class="file-box">' +
						'   <input type="text" name="textfield" class="textfield" /> ' +
						'   <input type="button" class="btn file" value="浏览..." />' +
						'   <input type="file" class="upfile" name="file"  size="28" v-model="file' + (new Date()).valueOf() + '" />' +
						'   <input type="button" name="submit" class="btn" value="上传" ng-click="uploadFile()" />' +
						'</div> ',
					replace: true,
					scope: {},

					link: function (scope, element, attr) {
						/**
						 * ps:新增属性options的可配置项，matches
						 * eg: matches=["txt","xls","xlsx","html","pdf"]
						 */
						var textinputs, textfield, btn_bower, upfile, btn_submit, options, callback, path = "";
						var fn = attr.path;
						textinputs = element[0].getElementsByTagName('input');
						textfield = $(textinputs[0]);
						upfile = $(textinputs[2]); // model
						options = $.extend({
							successCall: angular.noop,
							failCall: null
						}, angular.fromJson(attr.options || {}));
						initPargs();

						var ngModel = attr.ngModel,
							getter = $parse(ngModel),
							setter = getter.assign;


						function initPargs() {
							scope.fileinfo = {
								isupload: false
							};
							callback = {
								success: scope.$parent.$eval(options.successCall),
								fail: options.failCall && scope.$parent.$eval(options.failCall),
							}
						}
						upfile.hide();
						$(element).find('input.file').click(function () {
							upfile.trigger('click');
						});
						upfile.bind('change', function () {
							var name = (upfile.val() + "").replace(/.*\\/, "");
							textfield.val(name);
							setter(scope.$parent,name);
							//alert("请点击上传");
						});

						function isMatch() {
							var SUPERMAP = {
								"txt":"text/plain",
								"xls":"application/vnd.ms-excel",
								"xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
								"docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
								"html":"text/html",
								"gif":"image/gif",
								"pdf":"application/pdf",
								"png":"image/png",
								"ppt":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
								"xml":"text/xml",
								"zip":"application/x-zip-compressed",
								"jpeg":"image/jpeg",
								"jpg":"image/jpg",
								"js":"application/javascript",
								"jasper":"application/octet-stream"};
							var matches = options.matches && options.matches.split(";");//页面自定义配置的文件类型
							var SUPERMAP_key = [],//简写格式
								SUPERMAP_value = [],//完整格式
								access = [];

							for(var i in SUPERMAP){
								SUPERMAP_key.push(i);
								SUPERMAP_value.push(SUPERMAP[i]);
							}
							matches = matches || SUPERMAP_key;
							for (var i = 0; i < matches.length; i++) {
								var item = matches[i];
								SUPERMAP[item] && access.push(SUPERMAP[item]);//允许的文件类型
							}

							if($.inArray(arguments[0], access)!=-1)
								return true;
							return false;
						}

						scope.uploadFile = function () {
							var file = upfile[0].files[0];
							if (angular.isUndefined(file)) {
								//alert("请先添加文件");
								return false;
							}
							// jasper文件特殊处理
							var re = new RegExp("(.jasper)$");
							if(re.test(file.name)){
                                if(!isMatch("application/octet-stream")){
									//alert("文件类型错误，请重新添加文件");
									return false;
								}
                            }else{
	                            // 加判断
								if(!isMatch(file.type)){
									//alert("文件类型错误，请重新添加文件");
									return false;
								}	
                            }
							var fileinfo = scope.$parent.$eval(attr.fileinfo);
							var uploadname;
							if (fileinfo != undefined && fileinfo != null) {
								if (fileinfo.path != undefined && fileinfo.path != null) {
									uploadname = fileinfo.path;
								}
								if (fileinfo.filename != undefined && fileinfo.filename != null) {
									uploadname = uploadname + "/" + fileinfo.filename;
								} else if (fileinfo.filepattern != undefined && fileinfo.filepattern != null && fileinfo.issub) {
									uploadname = uploadname + "/" + fileinfo.filepattern + file.name;
								} else if (fileinfo.filepattern != undefined && fileinfo.filepattern != null && !fileinfo.issub) {
									uploadname = uploadname + "/" + file.name + fileinfo.filepattern;
								}
							} else {
								uploadname = textfield.val();
							}

							var data = new FormData();

							data.append("file", file);
							if (fileinfo) {
								data.append("fileinfo", {
									"filename": uploadname, "tftpid": fileinfo.tftpid
								});
							}

							if (fn) {
								path = scope.$parent[fn]();
							}
							
							data.append("filename", path + uploadname);
							data.append("routecode", scope.$root.getWindow().tradeId);
							data.append("TLECOD", $rootScope.$userinfo.TLECOD);
							data.append("BZBRCH", $rootScope.$userinfo.BZBRCH);
							data.append("CHANEL", $rootScope.$userinfo.CHANEL);
							data.append("sysgroup", $rootScope.$userinfo.sysgroup);
							data.append("TMNLCD", $rootScope.$userinfo.TMNLCD);

							var ajaxSetting = {
								method: 'POST',
								// url: $rootScope.$TrsContext+$SystemConfig.uploadUrl,
								data: data,
								headers: {
									'Content-Type': undefined
								}
							};

							$http(ajaxSetting).success(function (data, status, headers) {
								if (data.resultcode == "0000") {
									callback.success && callback.success(data);

								} else {
									callback.fail && callback.fail(data);
								}
							}).error(function (data) {
								callback.fail && callback.fail(data);
							});

						};
					}
				};
			}
		]);
	angular.module('app').service("filedownload", ['$rootScope', '$http', function ($rootScope, $http) {
		var service = {
			start: function (data, success, fail, config) {
				var ajaxSetting = {
					method: 'POST',
					// url: $rootScope.$TrsContext+$SystemConfig.downloadUrl,
					data: data,
					responseType: 'arraybuffer'
				};
				angular.extend(ajaxSetting, config);
				$http(ajaxSetting).success(function (data, status, headers) {
					headers = headers();
					try {
						var blob = new Blob([data], {
							type: "application/octet-stream;charset=UTF-8",
						});
						if (blob.size) {
							var objectUrl = URL.createObjectURL(blob);
							var anchor = document.createElement("a");
							anchor.href = objectUrl;
							anchor.download = headers["content-disposition"].split('filename=')[1];
							anchor.click();
							window.URL.revokeObjectURL(blob);
						}
					} catch (ex) {
						console.error(ex);
						fail && fail("下载失败");
						return false;
					}
					success && success(data);
				}).error(function () {
					fail && fail("下载失败");
				});
			},
			downloadBytes: function(bytesArray,callback, fail) {
				//直接以流文件格式下载内容
				try {
						var blob = new Blob([bytesArray], {
							type: "application/octet-stream;charset=UTF-8",
						});
						if (blob.size) {
							var objectUrl = URL.createObjectURL(blob);
							var anchor = document.createElement("a");
							anchor.href = objectUrl;
							anchor.click();
							window.URL.revokeObjectURL(blob);
						}
					} catch (ex) {
						console.error(ex);
						fail && fail("下载失败");
						return false;
					}
					callback && callback(bytesArray);
			}
		};

		return service;
	}]);
})(window, window.angular);