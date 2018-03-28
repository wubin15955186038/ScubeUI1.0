(function(){
    angular.module('tableHelper',[]).
    filter('tableTdFilt',function(){
        return function (input,tdObj,dicArr){
            var tdVal;
           if(tdObj.dictionary && dicArr.length==1){
               input = dicArr[0].dataTrsVal
           }
            switch(tdObj.type){
                case 'date':date();break;
            }
            function date(){
                if(typeof input == 'string' && input.length==8 && input.indexOf('-')==-1)
                {input = input.substr(0,4)+"-"+input.substr(4,2)+"-"+input.substr(6,2);}
                else if(input ==null||input ==undefined||input =="null"||input =="undefined")
                {input = "";}
                else {throw Error("date:"+input+":格式有误  正确格式char8:yyyymmdd");}
            }
            tdVal = input;
            return tdVal;
        }
    }).
    directive('htTable', function($timeout){
        var linkFunc = function(scope, element, attrs){
            angular.element(element).attr('draggable',false);
            scope.selected = scope.selected||{};//选中的记录
            scope.selected.select = scope.selected.select|| [];
            scope.datasource = scope.datasource||{};
            scope.datasource.ds = scope.datasource.ds|| [];//表记录的数据源
            var tHeadElem = angular.element(element).find('thead');
            var tBodyElem = angular.element(element).find('tbody');

            for(var n=0;n<scope.ths.length;n++){
                scope.ths[n].$$sortThSeq = n;
            };
            var dragger = function() {
                if(scope.draggable && scope.draggable !== 'false'){
                    angular.element(element).sortable({
                        //opacity:.75,
                        items:"th:not(.ui-state-disabledd)",
                        //placeholder:"jquery-ui-placeholder",
                        start: function(e,t) {},
                        stop: function(e,t) {
                            var selfIndex,nextSiblingIndex,previousSiblingIndex;
                            var _item = t.item[0];
                            var self = angular.element(_item).attr('eg-name');
                            if(!-[1,]){
                                var nextSibling = angular.element(_item.nextSibling).attr('eg-name');
                                var previousSibling = angular.element(_item.previousSibling).attr('eg-name');
                            }else {
                                var nextSibling = angular.element(_item.nextElementSibling).attr('eg-name');
                                var previousSibling = angular.element(_item.previousElementSibling).attr('eg-name');
                            }
                            for(var j=0;j<scope.ths.length;j++){
                                if(scope.ths[j].egName==self){
                                    selfIndex =j;break;
                                };
                            };
                            var th = scope.ths.splice(selfIndex,1);
                            for(var i=0;i<scope.ths.length;i++){
                                if(scope.ths[i].egName==nextSibling){nextSiblingIndex =i;};
                                if(scope.ths[i].egName==previousSibling){previousSiblingIndex =i;};
                            };
                            if(nextSiblingIndex!==undefined){
                                scope.ths.splice(nextSiblingIndex,0,th[0]);
                                for(var n=0;n<scope.ths.length;n++){
                                    scope.ths[n].$$sortThSeq = n;
                                };
                            }else if(previousSiblingIndex!==undefined){
                                scope.ths.splice(previousSiblingIndex+1,0,th[0]);
                                for(var p=0;p<scope.ths.length;p++){
                                    scope.ths[p].$$sortThSeq = p;
                                };
                            }else{
                                scope.ths.splice(selfIndex,0,th[0]);
                                for(var n=0;n<scope.ths.length;n++){
                                    scope.ths[n].$$sortThSeq = n;
                                };
                            };
                            scope.ths.sort(function(a, b) {
                                if(a.$$sortThSeq > b.$$sortThSeq) return 1;
                                if(a.$$sortThSeq < b.$$sortThSeq) return -1;
                                return 0;
                            });
                            render();
                        }
                    });
                }
            }
            var getEventTarget = function() {
                return window.event.target||window.event.srcElement;
            }
            var sortDir =1;//排序标志
            var sortEvent = function(){
                sortDir = sortDir * -1;
                var _target = getEventTarget();
                var col = _target.getAttribute('sort-attr');
                var previousSibling;
                if(!-[1,]){ 
                    previousSibling = _target.previousSibling;
                }else {
                    previousSibling = _target.previousElementSibling;
                }
                previousSibling.sortted = (previousSibling.sortted * -1) || 1;
                switch(previousSibling.sortted){
                    case 1:{
                        $(_target.previousSibling).css({
                            "border-bottom": "4px solid",
                            "border-top": "none"
                        })
                    };break;
                    case -1:{
                        $(_target.previousSibling).css({
                            "border-top": "4px solid",
                            "border-bottom": "none"
                        })
                    };break;
                }
                scope.datasource.ds.sort(function(a,b){
                    if(a[col] > b[col]) return 1 * sortDir;
                    if(a[col] < b[col]) return -1 * sortDir;
                    return 0;
                });

                renderBody();
            }
            var columnEvent = function () {
                var _target = getEventTarget();
                var columnIndex = _target.getAttribute('columnIndex');
                var rowIndex = _target.getAttribute('rowIndex');
                var columnFunction =scope.ths[columnIndex].docolumn();
                columnFunction(scope.datasource.ds[rowIndex]);
            }
            var clickOprationEvent = function() {
                var _target = getEventTarget();
                var rowIndex = _target.getAttribute('rowIndex');
                var menuIndex = _target.getAttribute('menuIndex');
                var callback = scope.doopration.menus[menuIndex].callback;
                var __type = Object.prototype.toString.apply(callback);
                if(__type == '[object Function]') {
                    callback.call(null, scope.datasource.ds[rowIndex]);
                }
            }
            var updateSelected = function (action, row) {
                var ret = contains(scope.selected.select,row);
                if (action == 'add' && !ret.contain) scope.selected.select.push(row);
                if (action == 'remove' && ret.contain) scope.selected.select.splice(ret.index, 1);
            }
            var shallowCopy = function(src, dst) {
                if (angular.isArray(src)) {
                    dst = dst || [];

                    for ( var i = 0; i < src.length; i++) {
                        dst[i] = src[i];
                    }
                } else if (angular.isObject(src)) {
                    dst = dst || {};

                    for (var key in src) {
                        if (src.hasOwnProperty( key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                            dst[key] = src[key];
                        }
                    }
                }

                return dst || src;
            }
            var defaultEquality = function(a, b) {
                if (a === undefined || b === undefined)
                    return false;
                a = shallowCopy(a);
                b = shallowCopy(b);
                return angular.equals(a, b);
            }
            var contains = function(Arry,obj){
                var contain = false;
                var index = -1;
                if(angular.isArray(Arry)){
                    for(var i=0;i<Arry.length;i++){
                        if(defaultEquality(Arry[i],obj)){
                            contain = true;
                            index = i;
                            break;
                        }
                    }
                    return {contain:contain,index:index};
                }else {
                    throw Error("selected.select不是arry类型！")
                }
            }
            var updateSelectionEvent = function () {
                if(!scope.docheckbox || scope.docheckbox === 'false') return;
                var _target = getEventTarget();
                if(_target.type === 'checkbox') {
                    _target.checked = !_target.checked;
                }
                if(_target.tagName != 'tr') {
                    do{
                        _target = _target.parentNode;
                    }while(_target.tagName.toLowerCase() !== 'tr')
                }
                var checkbox, isAllChecked = true;
                var rowIndex = _target.getAttribute('rowIndex');
                var checkboxsElem = tBodyElem.find('input[type=checkbox]');
                if(scope.singlecheckbox && scope.singlecheckbox !== 'false'){
                    checkboxsElem.each(function(index,item){
                        item.checked = false;
                    });
                    scope.selected.select = [];
                }    
                checkbox = angular.element(_target).find('input[type=checkbox]')[0];
                checkbox.checked = !checkbox.checked;
                for (var i = checkboxsElem.length - 1; i >= 0; i--) {
                    if(!checkboxsElem[i].checked) {
                        isAllChecked = false;
                        break;
                    }
                }
                tHeadElem.find('input[type=checkbox]')[0].checked = isAllChecked;
        
                var action = (checkbox.checked ? 'add' : 'remove');
                updateSelected(action, scope.datasource.ds[rowIndex]);
            };
            var selectAllEvent = function () {
                var checkbox = getEventTarget();
                var action = (checkbox.checked ? 'add' : 'remove');
                tBodyElem.find('input[type=checkbox]').each(function(index,item){
                    item.checked = checkbox.checked;
                });
                for (var i = 0; i < scope.datasource.ds.length; i++) {
                    var entity = scope.datasource.ds[i];
                    updateSelected(action, entity);
                }
            };
            var isSelected = function (row) {
                if(scope.datasource.ds.length === 0) return;
                var isAllChecked = true;
                for (var i = 0; i < scope.datasource.ds.length; i++) {
                    var entity = scope.datasource.ds[i];
                    var ret = contains(scope.selected.select,entity);
                    if(ret.contain) {
                        tBodyElem.find('input')[i].checked = true;
                    } else {
                        isAllChecked = false;
                    }
                }
                tHeadElem.find('input')[0].checked = isAllChecked;
            };
            var isSelectedAll = function () {
                if(scope.selected.select.length !== scope.datasource.ds.length || scope.datasource.ds.length === 0) {
                    return false;
                }
                var flag = true;
                for(var i=0;i<scope.datasource.ds.length;i++){
                    var ret = contains(scope.selected.select,scope.datasource.ds[i]);
                    if(!ret.contain){
                        flag = false;break;
                    }
                }
                return flag;
            };
            var setDictionary = function(dictCode, dicVal) {
                
                if(!dictCode || !dicVal) return;
                if(dictionary !==''&& dictionary !==undefined){
                    if(typeof dictionary =='object'&&dictionary.length==null){
                        if(dictionary[dictCode]){
                            for (var j = 0;j<dictionary[dictCode].dataItems.length;j++) {
                                if(dictionary[dictCode].dataItems[j].dataVal == dicVal){
                                    return dictionary[dictCode].dataItems[j];
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        for (var i = 0;i<dictionary.length;i++){
                            if(dictionary[i].dictCode==dictCode){
                                for (var j = 0;j<dictionary[i].dataItems.length;j++) {
                                    if(dictionary[i].dataItems[j].dataVal == dicVal){
                                        return dictionary[i].dataItems[j];
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
            var transDateType = function(input) {
                if(typeof input == 'string' && input.length==8 && input.indexOf('-')==-1)
                {
                    input = input.substr(0,4)+"-"+input.substr(4,2)+"-"+input.substr(6,2);
                }
                else if(input ==null||input ==undefined||input =="null"||input =="undefined")
                {
                    input = "";
                }
                else 
                {
                    throw Error("date:"+input+":格式有误  正确格式char8:yyyymmdd");
                }
                return input;
            }
            var dragThEvent = function(){
                var evt = window.event ||arguments[0];
                if (!document.down) {
                    document.resizeControl = evt.srcElement;
                }
                if(scope.layout=='fixed' && scope.draggable && scope.draggable !== 'false'){
                    angular.element(element).sortable("disable");
                    angular.element(element).attr("draggable",false);
                }
            }

            var makeTHead = function () {

                var headerHtml = ['<tr id="', scope.htId, '">'];
                if (scope.docheckbox && scope.docheckbox !== 'false') {
                    headerHtml.push('<th class="ui-state-disabledd" style="width: 40px">');
                    headerHtml.push('<input type="checkbox"');
                    if(scope.singlecheckbox && scope.singlecheckbox !== 'false' ) {
                        headerHtml.push(' disabled="true"');
                    }
                    headerHtml.push('></th>');
                }
                headerHtml.push('<th class="ui-state-disabledd" style="width: 50px"><span>序号</span></th>');
                for (var i = 0; i < scope.ths.length; i++) {
                    var th = scope.ths[i];
                    //ng-repeat="th in ths |orderBy:\'$$sortThSeq\'"
                    headerHtml.push('<th style="width: '+th._width.width+'px;"')
                    headerHtml.push(' title="' +th.zhName+ '" eg-name="' +th.egName+ '">');
                    headerHtml.push('<i class="caret"></i>');
                    headerHtml.push('<a sort-attr="' +th.egName+ '">' +th.zhName+ '</a></th>');
                }
                if(scope.doopration.menus && scope.doopration.menus.length > 0) {
                    headerHtml.push('<th style="width:'+scope.doopration.width+'px;"><span>操作</span></th>');
                }
                headerHtml.push('</tr>');
                return headerHtml.join('');
            }
            var makeTBody = function() {
                var bodyHtml = [];
                for (var i = 0; i < scope.datasource.ds.length; i++) {
                    bodyHtml.push('<tr rowIndex="'+i+'">');
                    if (scope.docheckbox && scope.docheckbox !== 'false') {
                        bodyHtml.push('<td style="width: 40px">');
                        bodyHtml.push('<input type="checkbox" name="selected"/></td>');
                    }
                    bodyHtml.push('<td style="width: 50px">' + (i + 1) + '</td>');

                    var row = scope.datasource.ds[i];
                    for (var j = 0; j < scope.ths.length; j++) {
                        var td = scope.ths[j];
                        var transDict = setDictionary(td.dictionary, row[td.egName]);
                        var content = transDict ? transDict.dataTrsVal : row[td.egName];
                        if(td.type == 'date') {
                            content = transDateType(content);
                        }
                        content = (content === undefined || content === null) ? '' : content;
                        bodyHtml.push('<td class="data_td">');
                        if(td.href && td.href !== 'false') {
                            bodyHtml.push('<a style="cursor: pointer;" columnIndex="'+j+'" rowIndex="'+i+'"');
                            bodyHtml.push(' title="' +content+ '">' +content+ '</a></td>');
                        } else {
                            bodyHtml.push('<span title="'+content+'">'+content+'</span></td>');
                        }
                    }
                    if(scope.doopration.menus && scope.doopration.menus.length > 0) {
                        bodyHtml.push('<td class ="doopration" style="width: ' +scope.doopration.width+ 'px;">');
                        for (var m = 0; m < scope.doopration.menus.length; m++) {
                            var menu = scope.doopration.menus[m];
                            if (scope.filtCondition(scope.doopration.filterCondition, row, menu)) {
                                bodyHtml.push('<a rowIndex="'+i+'" menuIndex="'+m+'"'+
                                    'ng-click="clickOpration(row, menu.callback)"'+
                                    'ng-mousedown="mousedownOpration($event)"'+
                                    'ng-mouseup="mouseupOpration($event)"'+
                                    'ng-mouseover="mouseoverOpration($event)"'+
                                    'ng-mouseleave="mouseleaveOpration($event)"'+
                                    'style="cursor:pointer;border:none;color:#fff;border-radius:2px;'+
                                    'padding:2px 3px;font-size:12px;text-decoration:none;'+
                                    'background-color:#abbac3;margin-right:3px">' +menu.name+ '</a>');
                            }
                        }
                        bodyHtml.push('</td>');
                    }
                    bodyHtml.push('</tr>');
                }
                return bodyHtml.join('');
            }
            var renderHead = function() {
                tHeadElem.empty().append(makeTHead());
                tHeadElem.find('a').on('click', sortEvent);
                tHeadElem.find('input[type=checkbox]').on('click', selectAllEvent);
                tHeadElem.find('th').on('click', dragThEvent);
            }
            var renderBody = function() {
                tBodyElem.empty().append(makeTBody());
                tBodyElem.find('.data_td a').on('click', columnEvent);
                tBodyElem.find('tr').on('click', updateSelectionEvent);
                tBodyElem.find('.doopration a').on('click', clickOprationEvent);
                if(scope.docheckbox && scope.docheckbox !== 'false') {
                    isSelected();
                }
            }
            var render = function() {
                // console.log('i am render all');
                // if(!scope.isAssignable(attrs, 'doopration')) {
                //     scope.doopration = {};
                // }
                renderHead();
                renderBody();
                dragger();
            }
            scope.$watchCollection('datasource.ds', render);


            //------------------表头拖拽----------开始-----------------------------
            //var browserIE = navigator.appName=='Microsoft Internet Explorer'
            //var trim_Version = navigator.appVersion.split(';')[1].replace(/[]/g,"");
            //var browserIE8_9 = browserIE && (trim_Version=="MSIE8.0"||trim_Version=="MSIE9.0")
            
            //鼠标松开实现方法，设置图标为箭头，清空一些全局变量。重置document.down = null
            document.onmouseup = function() {
                document.down = null;
                var src = document.resizeControl;
                if (src) {
                    if(scope.layout=='fixed' && scope.draggable && scope.draggable !== 'false'){
                        angular.element(element).sortable("enable");
                        angular.element(element).attr("draggable",true);
                    }
                    src.style.cursor=null;
                    src.resize = null;
                    src.srcData = null;
                    document.resizeControl = null;

                }
            }
            //鼠标点击方法，
            document.onmousedown = function(e) {
                document.down = 1;
                if (document.resizeControl) {
                    var src = document.resizeControl;
                    var srcData = getoffset(src);
                    var ev = e || event;
                    var cX = ev.clientX;
                    var cY = ev.clientY;
                    var scrollData = getscroll(angular.element(element).find(".innerTable")[0])
                    //var scrollLeft = angular.element(element).find(".innerTable")[0].scrollLeft;
                    //var scrollTop = angular.element(element).find(".innerTable")[0].scrollTop;
                    cX+=scrollData[1];
                    cY+=scrollData[0];
                    if (cY >= srcData[0] && cY <= srcData[0] + srcData[3] && cX >= srcData[1] + srcData[2] - 10 && cX <= srcData[1] + srcData[2]) {
                        src.srcData = [src.clientWidth, ev.clientX];
                        src.resize = 1;
                    }
                }
            }
            //鼠标移动方法
            document.onmousemove = function(e) {
                if (document.resizeControl) {
                    var src = document.resizeControl;
                    var srcData = getoffset(src);
                    var ev = e || event;
                    var _cX = cX = ev.clientX;
                    var cY = ev.clientY;
                    var scrollData = getscroll(angular.element(element).find(".innerTable")[0])
                    //var scrollLeft = angular.element(element).find(".innerTable")[0].scrollLeft;
                    //var scrollTop = angular.element(element).find(".innerTable")[0].scrollTop;
                    cX+=scrollData[1];
                    cY+=scrollData[0];
                    //如果可以扩充，则改变鼠标样子。
                    if (cY >= srcData[0] && cY <= srcData[0] + srcData[3] && cX >= srcData[1] + srcData[2] - 10 && cX <= srcData[1] + srcData[2]) {
                        src.style.cursor = "W-resize";
                    }else {
                        if (!document.down) {
                            src.style.cursor = null;
                        }
                    }
                    if (document.down && src.resize) {
                        // 自身长度+增量
                        var newWidth =  src.srcData[0] +_cX - src.srcData[1];
                        if(newWidth > 0)
                        {
                            src.style.width= (newWidth).toString() + "px";
                        }
                    }
                }
            }
            function getscroll(src) {
                var st = 0; //获取控件相对于顶部的位置
                var sl = 0; //获取控件相对于左边的位置
                var p = src;
                while (p.parentNode) {
                    st += p.scrollTop;
                    sl += p.scrollLeft;
                    p = p.parentNode;
                }
                return [st, sl]
            }
            function getoffset(src) {
                var ct = 0; //获取控件相对于顶部的位置
                var cl = 0; //获取控件相对于左边的位置
                var p = src;
                while (p.offsetParent) {
                    ct += p.offsetTop;
                    cl += p.offsetLeft;
                    p = p.offsetParent;
                }
                return [ct, cl, src.clientWidth, src.clientHeight]
            }

            //------------------表头拖拽----------结束-----------------------------
            //------------------列移动----------开始-----------------------------
        };
        return {
            restrict: 'E',
            scope: {
                docheckbox:'@',
                htId:'@',
                draggable:'@',
                singlecheckbox:'@',
                //layout:'@',
                //dooption:'@',
                doopration: '=?',
                selected:'=?',
                datasource:'=?'
            },
            transclude :true,
            controller:["$scope", "$parse", function($scope, $parse){
                var ths = $scope.ths = [];
                $scope.doopration = $scope.doopration || {};
                //添加表头
                this.addTh = function(th){
                    if (ths.length == 0){};
                    if (th.width){
                        $scope.layout = "fixed";
                        $scope._layout = {
                            "table-layout":"fixed"
                        }
                        $scope.doopration.width = $scope.doopration.width || 100 ;
                    };
                    th._width = {
                        width:th.width||"100"
                    }
                    ths.push(th);
                };
                this.getTableId = function(){
                    return $scope.htId
                };

                $scope.isAssignable = function(attrs, propName) {
                    var fn = $parse(attrs[propName]);
                    return angular.isFunction(fn.assign);
                }
                $scope.mousedownOpration = function (event) {
                    angular.element(event.target).css({borderTop:'inset 1px',borderBottom:'outset 1px'});
                }
                $scope.mouseupOpration = function (event) {
                    angular.element(event.target).css({border:'none'});
                }
                $scope.mouseoverOpration = function (event) {
                    angular.element(event.target).css({backgroundColor:'#8b9aa3'});
                }
                $scope.mouseleaveOpration = function (event) {
                    angular.element(event.target).css({backgroundColor:'#abbac3'});
                }

                $scope.filtCondition = function(funct, row, opration)
                {
                    if(angular.isUndefined(funct))
                    {
                        return true;
                    }
                    else if(angular.isFunction(funct))
                    {
                        return  funct(row, opration)
                    }
                    else
                    {
                        return funct;
                    }
                }
            }],
            template :
            '<div class="outTable"><div ng-transclude></div>' +
            '<div class="innerTable" style="overflow-x: scroll;">' +
            '<table id="{{htId}}_table" class="table" ng-style="_layout">' +
            '<thead></thead>' +
            '<tbody></tbody>' +
            '</table></div>' +
            '</div>',
            link:linkFunc,
            replace:true
        };
    }).
    directive('htColumn',function($rootScope){
        return {
            restrict :'E',
            require :'^htTable',
            //transclude :true,
            scope :{
                dictionary:'@',
                type:'@',
                egName:'@',
                href:'@',
                width:'@',
                zhName:'@',
                docolumn:'&'
            },
            //template:'<th ng-transclude></th>',
            link :function(scope, element, attrs, tableCtrl){
                tableCtrl.addTh(scope);
                var tableId = tableCtrl.getTableId();
                $rootScope[tableId] = $rootScope[tableId] || [];
                $rootScope[tableId].push(attrs);
            },
            replace:true
        }
    }).
    directive('htPage',function(){
        var pageHtml = '<div class="myTable-footer">' +
            '<div class="myTable-footer-right pull-right" ng-show="conf.totalRecord > 0">' +
            '<button ng-class="{disabled: conf.pageNo == 1}" ng-click="prevPage()"><span>&laquo;</span></button>' +
            '<button ng-repeat="item in pageList track by $index" ng-class="{active: item == conf.pageNo, separate: item == \'...\'}" ' +
            'ng-click="changepageNo(item)">' +
            '<span>{{ item }}</span>' +
            '</button>' +
            '<button ng-class="{disabled: conf.pageNo == conf.numberOfPages}" ng-click="nextPage()"><span>&raquo;</span></button>' +
            '</div>' +
            '<div class="myTable-footer-left pull-left" ng-show="conf.totalRecord > 0 && !noselectpage"><p>' +
            '<select ng-model="conf.pageSize" ng-options="option for option in conf.perPageOptions " ng-change="changepageSize()"></select>' +
            '&nbsp;&nbsp;共<strong style="color:#2782B0;">{{ conf.totalRecord }}</strong>条' +
            '&nbsp;&nbsp;第&nbsp;<input type="text" ng-model="jumpPageNum" ng-keyup="jumpToPage()"/>&nbsp;页 ' +
            '<button class="primary" ng-show="excel" ng-click="excle(tableId)">Excel导出</button></p></div>' +//<button  ng-click="jumpToPage()">GO</button>
            '<div class="no-items" ng-show="conf.totalRecord <= 0">暂无数据</div>' +
            '</div>';
        return {
            restrict:'E',
            scope:{
                excel:"@",
                tableId:'@',
                noselectpage:'@',
                conf:'='
            },
            template:pageHtml,
            link:function(scope,elem,attrs){
                scope.excle = function(tableId){
                    var table = document.getElementById(tableId+"_table");
                    var uri ='data:application/vnd.ms-excel;base64,';
                    var template ='<html><head><meta http-equiv="content-type" content="text/html;charset=utf-8"></head><body><table>{table}</table></body></html>';
                    var base64 = function(s){
                        return window.btoa(unescape(encodeURIComponent(s)));
                    }
                    var format = function(s,c){
                        return s.replace(/{(\w+)}/g,function(m,p){return c[p]});
                    }
                    var ctx = {
                        worksheet:'worksheet',
                        table:table.innerHTML
                    };
                    window.location.href = uri + base64(format(template,ctx));
                };

                // 变更当前页
                scope.conf = scope.conf||{};
                scope.changepageNo = function(item){
                    if(item == '...'){
                        return;
                    }else{
                        scope.conf.pageNo = item;
                    }
                };
                // prevPage
                scope.prevPage = function(){
                    if(scope.conf.pageNo > 1){
                        scope.conf.pageNo -= 1;
                    }
                };
                // nextPage
                scope.nextPage = function(){
                    if(scope.conf.pageNo < scope.conf.numberOfPages){
                        scope.conf.pageNo += 1;
                    }
                };
                // 跳转页
                scope.jumpToPage = function(){
                    scope.jumpPageNum = (scope.jumpPageNum+'').replace(/[^0-9]/g,'');
                    var t = Math.floor(scope.conf.totalRecord/scope.conf.pageSize);
                    var totalPage = scope.conf.totalRecord%scope.conf.pageSize!=0?++t:t;
                    if(scope.jumpPageNum !== ''){
                        scope.jumpPageNum = parseInt(scope.jumpPageNum);
                        if(totalPage<scope.jumpPageNum){
                            scope.jumpPageNum = totalPage;
                        }
                        scope.conf.pageNo = scope.jumpPageNum;
                    }
                };
                // 修改每页显示的条数
                scope.changepageSize = function(){
                    // 清除本地存储的值方便重新设置
                    if(scope.conf.rememberPerPage){
                        localStorage.removeItem(scope.conf.rememberPerPage);
                    }
                    var t = Math.floor(scope.conf.totalRecord/scope.conf.pageSize);
                    var totalPage = scope.conf.totalRecord%scope.conf.pageSize!=0?++t:t;
                    if(totalPage<scope.conf.pageNo){
                        scope.conf.pageNo = totalPage;
                    }
                };
                // conf.pageNo
                scope.conf.pageNo = parseInt(scope.conf.pageNo) ? parseInt(scope.conf.pageNo) : 1;
                // conf.totalRecord
                scope.conf.totalRecord = parseInt(scope.conf.totalRecord)?parseInt(scope.conf.totalRecord):0;
                // conf.pageSize (default:10)
                // 先判断一下本地存储中有没有这个值
                if(scope.conf.rememberPerPage){
                    if(!parseInt(localStorage[scope.conf.rememberPerPage])){
                        localStorage[scope.conf.rememberPerPage] = parseInt(scope.conf.pageSize) ? parseInt(scope.conf.pageSize) : 15;
                    }

                    scope.conf.pageSize = parseInt(localStorage[scope.conf.rememberPerPage]);


                }else{
                    scope.conf.pageSize = parseInt(scope.conf.pageSize) ? parseInt(scope.conf.pageSize) : 10;
                }
                scope.$watch(function(){
                    var newValue = scope.conf.pageNo + ' '+scope.conf.totalRecord + ' ';
                    // 如果直接watch perPage变化的时候，因为记住功能的原因，所以一开始可能调用两次。
                    //所以用了如下方式处理
                    if(scope.conf.rememberPerPage){
                        // 由于记住的时候需要特别处理一下，不然可能造成反复请求
                        // 之所以不监控localStorage[scope.conf.rememberPerPage]是因为在删除的时候会undefind
                        // 然后又一次请求
                        if(localStorage[scope.conf.rememberPerPage]){
                            newValue += localStorage[scope.conf.rememberPerPage];
                        }else{
                            newValue += scope.conf.pageSize;
                        }
                    }else{
                        newValue += scope.conf.pageSize;
                    }
                    return newValue;
                }, getPagination);
                // pageList数组
                function getPagination(newval,oldval){
                    //alert(newval+'    '+oldval)
                    //if(newval == oldval)return;
                    //alert("继续分页")

                    // 定义分页的长度必须为奇数 (default:9)
                    scope.conf.pagesLength = parseInt(scope.conf.pagesLength) ? parseInt(scope.conf.pagesLength) : 9 ;
                    if(scope.conf.pagesLength % 2 === 0){
                        // 如果不是奇数的时候处理一下
                        scope.conf.pagesLength = scope.conf.pagesLength -1;
                    }
                    // conf.erPageOptions
                    if(!scope.conf.perPageOptions){
                        if(typeof table_pageSizeOptions !='undefined' && Object.prototype.toString.call(table_pageSizeOptions)=="[object Array]"){
                            var _table_pageSizeOptions = table_pageSizeOptions.slice(0);
                        }
                        scope.conf.perPageOptions = _table_pageSizeOptions ||[10, 15, 20, 30, 50];
                    }
                    // numberOfPages
                    scope.conf.numberOfPages = Math.ceil(scope.conf.totalRecord/scope.conf.pageSize);

                    if(scope.conf.pageNo > scope.conf.numberOfPages){
                        scope.conf.pageNo = scope.conf.numberOfPages;
                    }

                    // judge pageNo > scope.numberOfPages
                    if(scope.conf.pageNo < 1){
                        scope.conf.pageNo = 1;
                    }

                    // jumpPageNum
                    scope.jumpPageNum = scope.conf.pageNo;

                    // 如果pageSize在不在perPageOptions数组中，就把pageSize加入这个数组中
                    var perPageOptionsLength = scope.conf.perPageOptions.length;
                    // 定义状态
                    var perPageOptionsStatus;
                    for(var i = 0; i < perPageOptionsLength; i++){
                        if(scope.conf.perPageOptions[i] == scope.conf.pageSize){
                            perPageOptionsStatus = true;
                        }
                    }
                    // 如果pageSize在不在perPageOptions数组中，就把pageSize加入这个数组中
                    if(!perPageOptionsStatus){
                        scope.conf.perPageOptions.push(scope.conf.pageSize);
                    }

                    // 对选项进行sort
                    scope.conf.perPageOptions.sort(function(a, b){return a-b});

                    scope.pageList = [];
                    if(scope.conf.numberOfPages <= scope.conf.pagesLength){
                        // 判断总页数如果小于等于分页的长度，若小于则直接显示
                        for(i =1; i <= scope.conf.numberOfPages; i++){
                            scope.pageList.push(i);
                        }
                    }else{
                        // 总页数大于分页长度（此时分为三种情况：1.左边没有...2.右边没有...3.左右都有...）
                        // 计算中心偏移量
                        var offset = (scope.conf.pagesLength - 1)/2;
                        if(scope.conf.pageNo <= offset){
                            // 左边没有...
                            for(i =1; i <= offset +1; i++){
                                scope.pageList.push(i);
                            }
                            scope.pageList.push('...');
                            scope.pageList.push(scope.conf.numberOfPages);
                        }else if(scope.conf.pageNo > scope.conf.numberOfPages - offset){
                            scope.pageList.push(1);
                            scope.pageList.push('...');
                            for(i = offset + 1; i >= 1; i--){
                                scope.pageList.push(scope.conf.numberOfPages - i);
                            }
                            scope.pageList.push(scope.conf.numberOfPages);
                        }else{
                            // 最后一种情况，两边都有...
                            scope.pageList.push(1);
                            scope.pageList.push('...');

                            for(i = Math.ceil(offset/2) ; i >= 1; i--){
                                if(scope.conf.pageNo!==2)
                                scope.pageList.push(scope.conf.pageNo - i);
                            }
                            scope.pageList.push(scope.conf.pageNo);
                            for(i = 1; i <= offset/2; i++){
                                scope.pageList.push(scope.conf.pageNo + i);
                            }

                            scope.pageList.push('...');
                            scope.pageList.push(scope.conf.numberOfPages);
                        }
                    }

                    if(scope.conf.onChange){
                        scope.conf.onChange();
                    }
                }
            },
            replace:true
        }
    })
}());
