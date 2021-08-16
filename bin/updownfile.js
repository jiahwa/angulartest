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
						'   <input type="button" class="btn file" value="scan..." />' +
						'   <input type="file" class="upfile" name="file"  size="28" v-model="file' + (new Date()).valueOf() + '" />' +
						'   <input type="button" name="submit" class="btn" value="upload" ng-click="uploadFile()" />' +
						'</div> ',
					replace: true,
					scope: {},

					link: function (scope, element, attr) {
						/**
						 * matches can config，eg: matches=["txt","xls","xlsx","html","pdf"]
						 */
						var textinputs, textfield, btn_bower, upfile, btn_submit, options, callback, path = "";
						var fn = attr.path;
						textinputs = element[0].getElementsByTagName('input');
						textfield = $(textinputs[0]);
						upfile = $(textinputs[2]); 
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
							alert("please click upload button");
							
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
							var matches = options.matches && options.matches.split(";");
							var SUPERMAP_key = [],
								SUPERMAP_value = [],
								access = [];

							for(var i in SUPERMAP){
								SUPERMAP_key.push(i);
								SUPERMAP_value.push(SUPERMAP[i]);
							}
							matches = matches || SUPERMAP_key;
							for (var i = 0; i < matches.length; i++) {
								var item = matches[i];
								SUPERMAP[item] && access.push(SUPERMAP[item]);
							}

							if($.inArray(arguments[0], access)!=-1)
								return true;
							return false;
						}

						scope.uploadFile = function () {
							var file = upfile[0].files[0];
							if (angular.isUndefined(file)) {
								alert("please add your file");
								return false;
							}
							
							var re = new RegExp("(.jasper)$");
							if(re.test(file.name)){
                                if(!isMatch("application/octet-stream")){
									alert("file type error");
									return false;
								}
                            }else{
	                            
								if(!isMatch(file.type)){
									alert("file type error");
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
								url: 'xxx.uploadUrl.do',
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
					url: 'xxx.downloadUrl.do',
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
						fail && fail("download err");
						return false;
					}
					success && success(data);
				}).error(function () {
					fail && fail("download err");
				});
			},
			downloadBytes: function(bytesArray,callback, fail) {
				
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
						fail && fail("download err");
						return false;
					}
					callback && callback(bytesArray);
			}
		};

		return service;
	}]);
})(window, window.angular);