// ==UserScript==
// @name        KF Online助手
// @namespace   https://greasyfork.org/users/4514
// @icon        https://raw.githubusercontent.com/miaolapd/KF_Online_Assistant/master/icon.png
// @author      喵拉布丁
// @homepage    https://github.com/miaolapd/KF_Online_Assistant
// @description KFOL必备！可在绯月Galgame上自动进行争夺、抽取神秘盒子以及KFB捐款，并可使用各种便利的辅助功能，更多功能开发中……
// @updateURL   https://git.oschina.net/miaolapd/KF_Online_Assistant/raw/master/release/ScriptStorage.meta.js
// @downloadURL https://git.oschina.net/miaolapd/KF_Online_Assistant/raw/master/release/ScriptStorage.user.js
// @include     http://*2dgal.com/*
// @include     http://*9moe.com/*
// @include     http://*kfgal.com/*
// @version     5.2.6
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @run-at      document-end
// @license     MIT
// @include-jquery   true
// @use-greasemonkey true
// ==/UserScript==
// 版本号
var version = '5.2.6';
/**
 * 助手设置和日志的存储位置类型
 * Default：存储在浏览器的localStorage中，设置仅通过域名区分，日志通过域名和uid区分；
 * Script：存储在油猴脚本的配置中，设置和日志仅通过uid区分（可用于设置经常会被浏览器清除的情况）;
 * Global：存储在油猴脚本的配置中，各域名和各uid使用全局设置，日志仅通过uid区分（可用于想要使用全局设置的情况）；
 */
var storageType = 'Script';
// 可先在设置界面里修改好相应设置，再将导入/导出设置文本框里的设置填入此处即可覆盖相应的默认设置（可用于设置经常会被浏览器清除或想要使用全局设置的情况）
// 例：var myConfig = {"autoDonationEnabled":true,"donationKfb":100};
var myConfig = {};

/**
 * 配置类
 */
// （注意：请到设置界面里修改相应设置，请勿在代码里修改！）
var Config = {
    // 是否开启定时模式，可按时进行自动操作（包括捐款、争夺、抽取神秘盒子，需开启相关功能），只在论坛首页生效，true：开启；false：关闭
    autoRefreshEnabled: false,
    // 在首页的网页标题上显示定时模式提示的方案，auto：停留一分钟后显示；always：总是显示；never：不显示
    showRefreshModeTipsType: 'auto',
    // 是否自动KFB捐款，true：开启；false：关闭
    autoDonationEnabled: false,
    // KFB捐款额度，取值范围在1-5000的整数之间；可设置为百分比，表示捐款额度为当前收入的百分比（最多不超过5000KFB），例：80%
    donationKfb: '1',
    // 在当天的指定时间之后捐款（24小时制），例：22:30:00（注意不要设置得太接近零点，以免错过捐款）
    donationAfterTime: '00:05:00',
    // 是否自动争夺，可自动领取争夺奖励，并可自动进行批量攻击（可选），true：开启；false：关闭
    autoLootEnabled: false,
    // 在指定的时间段内不自动领取争夺奖励（主要与在指定时间内才攻击配合使用），例：['07:00-08:15','17:00-18:15']，留空表示不启用
    noAutoLootWhen: [],
    // 是否在领取争夺奖励时，当本回合剩余攻击次数不低于{@link Config.deferLootTimeWhenRemainAttackNum}所设定的次数的情况下，抽取神秘盒子以延长争夺时间，true：开启；false：关闭
    deferLootTimeWhenRemainAttackNumEnabled: false,
    // 抽取神秘盒子以延长争夺时间的剩余攻击次数的上限
    deferLootTimeWhenRemainAttackNum: 15,
    // 是否自定义怪物名称，true：开启；false：关闭
    customMonsterNameEnabled: false,
    // 自定义怪物名称列表，格式：{怪物ID：'自定义名称'}，例：{1:'萝莉',5:'信仰风'}
    customMonsterNameList: {},
    // 是否在自动领取争夺奖励后，自动进行批量攻击（需指定攻击目标），true：开启；false：关闭
    autoAttackEnabled: false,
    // 在距本回合结束前指定时间内才自动完成（剩余）批量攻击，取值范围：660-63（分钟），设置为0表示不启用（注意不要设置得太接近最小值，以免错过攻击）
    attackAfterTime: 0,
    // 是否当生命值不超过低保线时自动进行试探攻击（需同时设置在距本回合结束前指定时间内才自动完成批量攻击），true：开启；false：关闭
    attemptAttackEnabled: false,
    // 批量攻击的目标列表，格式：{怪物ID:次数}，例：{1:10,2:10}
    batchAttackList: {},
    // 当拥有致命一击时所自动攻击的怪物ID，设置为0表示保持默认
    deadlyAttackId: 0,
    // 是否自动使用批量攻击后刚掉落的道具，需指定自动使用的道具名称，true：开启；false：关闭
    autoUseItemEnabled: false,
    // 自动使用批量攻击后刚掉落的道具的名称，例：['被遗弃的告白信','学校天台的钥匙','LOLI的钱包']
    autoUseItemNames: [],
    // 是否自动抽取神秘盒子，true：开启；false：关闭
    autoDrawSmbox2Enabled: false,
    // 偏好的神秘盒子数字，例：[52,1,28,400]（以英文逗号分隔，按优先级排序），如设定的数字都不可用，则从剩余的盒子中随机抽选一个，如无需求可留空
    favorSmboxNumbers: [],
    // 对首页上的有人@你的消息框进行处理的方案，no_highlight：取消已读提醒高亮；no_highlight_extra：取消已读提醒高亮，并在无提醒时补上消息框；
    // hide_box_1：不显示已读提醒的消息框；hide_box_2：永不显示消息框；default：保持默认；at_change_to_cao：将@改为艹(其他和方式2相同)
    atTipsHandleType: 'no_highlight',
    // 是否在神秘等级升级后进行提醒，只在首页生效，true：开启；false：关闭
    smLevelUpAlertEnabled: false,
    // 是否在定时存款到期时进行提醒，只在首页生效，true：开启；false：关闭
    fixedDepositDueAlertEnabled: false,
    // 是否在神秘系数排名发生变化时进行提醒，只在首页生效，true：开启；false：关闭
    smRankChangeAlertEnabled: false,
    // 在首页帖子链接旁显示快速跳转至页末的链接，true：开启；false：关闭
    homePageThreadFastGotoLinkEnabled: true,
    // 是否在首页显示VIP剩余时间，true：开启；false：关闭
    showVipSurplusTimeEnabled: false,
    // 是否在帖子列表页面中显示帖子页数快捷链接，true：开启；false：关闭
    showFastGotoThreadPageEnabled: false,
    // 在帖子页数快捷链接中显示页数链接的最大数量
    maxFastGotoThreadPageNum: 5,
    // 帖子每页楼层数量，用于电梯直达和帖子页数快捷链接功能，如果修改了KF设置里的“文章列表每页个数”，请在此修改成相同的数目
    perPageFloorNum: 10,
    // 是否在帖子列表中高亮今日新发表帖子的发表时间，true：开启；false：关闭
    highlightNewPostEnabled: true,
    // 是否调整帖子内容宽度，使其保持一致，true：开启；false：关闭
    adjustThreadContentWidthEnabled: false,
    // 帖子内容字体大小，留空表示使用默认大小，推荐值：14
    threadContentFontSize: 0,
    // 自定义本人的神秘颜色（包括帖子页面的ID显示颜色和楼层边框颜色，仅自己可见），例：#009CFF，如无需求可留空
    customMySmColor: '',
    // 是否开启自定义各等级神秘颜色的功能，（包括帖子页面的ID显示颜色和楼层边框颜色，仅自己可见），true：开启；false：关闭
    customSmColorEnabled: false,
    // 自定义各等级神秘颜色的设置列表，例：[{min:'50',max:'100',color:'#009CFF'},{min:'800',max:'MAX',color:'#FF0000'}]
    customSmColorConfigList: [],
    // 是否将帖子中的绯月其它域名的链接修改为当前域名，true：开启；false：关闭
    modifyKFOtherDomainEnabled: true,
    // 是否在帖子页面开启多重回复和多重引用的功能，true：开启；false：关闭
    multiQuoteEnabled: true,
    // 是否在帖子页面开启批量购买帖子的功能，true：开启；false：关闭
    batchBuyThreadEnabled: true,
    // 是否开启显示用户的自定义备注的功能，true：开启；false：关闭
    userMemoEnabled: false,
    // 用户自定义备注列表，格式：{'用户名':'备注'}，例：{'李四':'张三的马甲','王五':'张三的另一个马甲'}
    userMemoList: {},
    // 是否在帖子页面解析多媒体标签，true：开启；false：关闭
    parseMediaTagEnabled: true,
    // 默认提示消息的持续时间（秒），设置为-1表示永久显示
    defShowMsgDuration: -1,
    // 是否禁用jQuery的动画效果（推荐在配置较差的机器上使用），true：开启；false：关闭
    animationEffectOffEnabled: false,
    // 日志保存天数
    logSaveDays: 30,
    // 在页面上方显示助手日志的链接，true：开启；false：关闭
    showLogLinkInPageEnabled: true,
    // 日志内容的排序方式，time：按时间顺序排序；type：按日志类别排序
    logSortType: 'time',
    // 日志统计范围类型，cur：显示当天统计结果；custom：显示距该日N天内的统计结果；all：显示全部统计结果
    logStatType: 'cur',
    // 显示距该日N天内的统计结果（用于日志统计范围）
    logStatDays: 7,
    // 是否为侧边栏添加快捷导航的链接，true：开启；false：关闭
    addSideBarFastNavEnabled: true,
    // 是否将侧边栏修改为和手机相同的平铺样式，true：开启；false：关闭
    modifySideBarEnabled: false,
    // 是否为页面添加自定义的CSS内容，true：开启；false：关闭
    customCssEnabled: false,
    // 自定义CSS的内容
    customCssContent: '',
    // 是否执行自定义的脚本，true：开启；false：关闭
    customScriptEnabled: false,
    // 在脚本开始时执行的自定义脚本内容
    customScriptStartContent: '',
    // 在脚本结束时执行的自定义脚本内容
    customScriptEndContent: '',
    // 浏览器类型，auto：自动检测；desktop：桌面版；mobile：移动版
    browseType: 'auto',
    // 是否开启关注用户的功能，true：开启；false：关闭
    followUserEnabled: false,
    // 关注用户列表，格式：[{name:'用户名'}]，例：[{name:'张三'}, {name:'李四'}]
    followUserList: [],
    // 是否高亮所关注用户在首页下的帖子链接，true：开启；false：关闭
    highlightFollowUserThreadInHPEnabled: true,
    // 是否高亮所关注用户在帖子列表页面下的帖子链接，true：开启；false：关闭
    highlightFollowUserThreadLinkEnabled: true,
    // 是否开启屏蔽用户的功能，true：开启；false：关闭
    blockUserEnabled: false,
    // 屏蔽用户的默认屏蔽类型，0：屏蔽主题和回贴；1：仅屏蔽主题；2：仅屏蔽回贴
    blockUserDefaultType: 0,
    // 是否屏蔽被屏蔽用户的@提醒，true：开启；false：关闭
    blockUserAtTipsEnabled: true,
    // 屏蔽用户的版块屏蔽范围，0：所有版块；1：包括指定的版块；2：排除指定的版块
    blockUserForumType: 0,
    // 屏蔽用户的版块ID列表，例：[16, 41, 67, 57, 84, 92, 127, 68, 163, 182, 9]
    blockUserFidList: [],
    // 屏蔽用户列表，格式：[{name:'用户名', type:屏蔽类型}]，例：[{name:'张三', type:0}, {name:'李四', type:1}]
    blockUserList: [],
    // 是否开启屏蔽标题包含指定关键字的帖子的功能，true：开启；false：关闭
    blockThreadEnabled: false,
    // 屏蔽帖子的默认版块屏蔽范围，0：所有版块；1：包括指定的版块；2：排除指定的版块
    blockThreadDefForumType: 0,
    // 屏蔽帖子的默认版块ID列表，例：[16, 41, 67, 57, 84, 92, 127, 68, 163, 182, 9]
    blockThreadDefFidList: [],
    // 屏蔽帖子的关键字列表，格式：[{keyWord:'关键字', userName: ['用户名'], includeFid:[包括指定的版块ID], excludeFid:[排除指定的版块ID]}]
    // 关键字可使用普通字符串或正则表达式（正则表达式请使用'/abc/'的格式），userName、includeFid和excludeFid这三项为可选
    // 例：[{keyWord: '标题1'}, {keyWord: '标题2', userName:['用户名1', '用户名2'], includeFid: [5, 56]}, {keyWord: '/关键字A.*关键字B/i', excludeFid: [92, 127, 68]}]
    blockThreadList: [],
    // 是否在当前收入满足指定额度之后自动将指定数额存入活期存款中，只会在首页触发，true：开启；false：关闭
    autoSaveCurrentDepositEnabled: false,
    // 在当前收入已满指定KFB额度之后自动进行活期存款，例：1000
    saveCurrentDepositAfterKfb: 0,
    // 将指定额度的KFB存入活期存款中，例：900；举例：设定已满1000存900，当前收入为2000，则自动存入金额为1800
    saveCurrentDepositKfb: 0,
    // 是否自动更换神秘颜色，true：开启；false：关闭
    autoChangeSMColorEnabled: false,
    // 自动更换神秘颜色的更换顺序类型，random：随机；sequence：顺序
    autoChangeSMColorType: 'random',
    // 自动更换神秘颜色的时间间隔（小时）
    autoChangeSMColorInterval: 24,
    // 是否从当前所有可用的神秘颜色中进行更换，true：开启；false：关闭
    changeAllAvailableSMColorEnabled: true,
    // 自定义自动更换神秘颜色的ID列表，例：[1,8,13,20]
    customAutoChangeSMColorList: []
};

/**
 * 配置常量类
 */
// （注意：以下代码如非必要请勿修改）
var Const = {
    // 开启调试模式，true：开启；false：关闭
    debug: false,
    // UTC时间与论坛时间之间的时差（小时）
    forumTimezoneOffset: -8,
    // KFB捐款额度的最大值
    maxDonationKfb: 5000,
    // 争夺的默认领取间隔（分钟）
    defLootInterval: 660,
    // 争夺初始的预领KFB
    lootInitialBonus: 100,
    // 所允许的在距本回合结束前指定时间后才进行自动批量攻击的最小时间（分钟）
    minAttackAfterTime: 63,
    // 在实际生命值不超过指定值时才进行试探攻击，-1表示使用低保值
    maxAttemptAttackLifeNum: 10,
    // 每回合攻击的最大次数
    maxAttackNum: 20,
    // 致命一击比例
    deadlyAttackPercent: 1.5,
    // 抽取神秘盒子头奖的奖金（KFB）
    smboxFirstPrizeBonus: 2000,
    // 在批量攻击中每次攻击的时间间隔（毫秒），可设置为函数来返回值
    perAttackInterval: function () {
        return Math.floor(Math.random() * 1000) + 2000;
    },
    // 检查正在进行的自动攻击是否已完成的时间间隔（分钟）
    checkAutoAttackingInterval: 4,
    // 在领取争夺奖励后首次检查生命值的时间间隔（分钟）
    firstCheckLifeInterval: 145,
    // 检查生命值的默认时间间隔（分钟）
    defCheckLifeInterval: 20,
    // 在进行试探攻击后检查生命值的时间间隔（分钟）
    checkLifeAfterAttemptAttackInterval: 2,
    // 神秘盒子的默认抽取间隔（分钟）
    defDrawSmboxInterval: 300,
    // 定时操作结束后的再判断间隔（秒），用于在定时模式中进行下一次定时时间的再判断
    actionFinishRetryInterval: 30,
    // 在连接超时的情况下获取剩余时间失败后的重试间隔（分钟），用于定时模式
    errorRefreshInterval: 1,
    // 在网页标题上显示定时模式提示的更新间隔（分钟）
    showRefreshModeTipsInterval: 1,
    // 标记已去除首页已读at高亮提示的Cookie有效期（天）
    hideMarkReadAtTipsExpires: 3,
    // 神秘系数排名变化的提醒间隔（小时）
    smRankChangeAlertInterval: 22,
    // 存储VIP剩余时间的Cookie有效期（分钟）
    vipSurplusTimeExpires: 60,
    // ajax请求的默认时间间隔（毫秒）
    defAjaxInterval: 200,
    // 特殊情况下的ajax请求（如使用、恢复、购买道具等）的时间间隔（毫秒），可设置为函数来返回值
    specialAjaxInterval: function () {
        return Math.floor(Math.random() * 150) + 200;
    },
    // 循环使用道具中每轮第一次ajax请求的时间间隔（毫秒），可设置为函数来返回值
    cycleUseItemsFirstAjaxInterval: function () {
        return Math.floor(Math.random() * 250) + 2000;
    },
    // 购买帖子提醒的最低售价（KFB）
    minBuyThreadWarningSell: 6,
    // 统计回帖者名单最大能访问的帖子页数
    statReplyersMaxPage: 300,
    // 道具样品ID列表
    sampleItemIdList: {
        '零时迷子的碎片': 2257935,
        '被遗弃的告白信': 2005272,
        '学校天台的钥匙': 2001303,
        'TMA最新作压缩包': 1990834,
        'LOLI的钱包': 1836588,
        '棒棒糖': 1942370,
        '蕾米莉亚同人漫画': 2231073,
        '十六夜同人漫画': 2025284,
        '档案室钥匙': 2025904,
        '傲娇LOLI娇蛮音CD': 2003056,
        '整形优惠卷': 2122387,
        '消逝之药': 1587342
    },
    // 定期存款到期期限（天）
    fixedDepositDueTime: 90,
    // 存储多重引用数据的LocalStorage名称
    multiQuoteStorageName: 'pd_multi_quote',
    // 神秘升级提醒的临时日志名称
    smLevelUpTmpLogName: 'SmLevelUp',
    // 神秘系数排名变化提醒的临时日志名称
    smRankChangeTmpLogName: 'SmRankChange',
    // 定期存款到期时间的临时日志名称
    fixedDepositDueTmpLogName: 'FixedDepositDue',
    // 上一次领取争夺奖励时记录的争夺信息的临时日志名称
    prevLootInfoTmpLogName: 'PrevLootInfo',
    // 上一次自动更换神秘颜色的ID的临时日志名称
    prevAutoChangeSMColorIdTmpLogName: 'PrevAutoChangeSMColorId',
    // 标记已KFB捐款的Cookie名称
    donationCookieName: 'pd_donation',
    // 标记已领取争夺奖励的Cookie名称
    getLootAwardCookieName: 'pd_get_loot_award',
    // 标记自动攻击已准备就绪的Cookie名称
    autoAttackReadyCookieName: 'pd_auto_attack_ready',
    // 标记正在进行自动攻击的Cookie名称
    autoAttackingCookieName: 'pd_auto_attacking',
    // 标记已检查生命值的Cookie名称
    checkLifeCookieName: 'pd_check_life',
    // 标记已完成的试探攻击次数的Cookie名称
    attackCountCookieName: 'pd_attack_count',
    // 存储上一次试探攻击日志的Cookie名称
    prevAttemptAttackLogCookieName: 'pd_prev_attempt_attack_log',
    // 标记已抽取神秘盒子的Cookie名称
    drawSmboxCookieName: 'pd_draw_smbox',
    // 标记已去除首页已读at高亮提示的Cookie名称
    hideMarkReadAtTipsCookieName: 'pd_hide_mark_read_at_tips',
    // 存储之前已读的at提醒信息的Cookie名称
    prevReadAtTipsCookieName: 'pd_prev_read_at_tips',
    // 标记已进行定期存款到期提醒的Cookie名称
    fixedDepositDueAlertCookieName: 'pd_fixed_deposit_due_alert',
    // 存储VIP剩余时间的Cookie名称
    vipSurplusTimeCookieName: 'pd_vip_surplus_time',
    // 标记已自动更换神秘颜色的Cookie名称
    autoChangeSMColorCookieName: 'pd_auto_change_sm_color',
    // 标记已检查过期日志的Cookie名称
    checkOverdueLogCookieName: 'pd_check_overdue_log'
};

/**
 * 配置方法类
 */
var ConfigMethod = {
    // 保存设置的键值名称
    name: 'pd_config',
    // 默认的Config对象
    defConfig: {},

    /**
     * 初始化
     */
    init: function () {
        $.extend(true, ConfigMethod.defConfig, Config);
        if (myConfig && $.type(myConfig) === 'object' && !$.isEmptyObject(myConfig)) {
            var options = ConfigMethod.normalize(myConfig);
            Config = $.extend(true, {}, ConfigMethod.defConfig, options);
        }
        ConfigMethod.read();
    },

    /**
     * 读取设置
     */
    read: function () {
        var options = null;
        if (storageType === 'Script') options = GM_getValue(ConfigMethod.name + '_' + KFOL.uid);
        else if (storageType === 'Global') options = GM_getValue(ConfigMethod.name);
        else options = localStorage.getItem(ConfigMethod.name);
        if (!options) return;
        try {
            options = JSON.parse(options);
        }
        catch (ex) {
            return;
        }
        if (!options || $.type(options) !== 'object' || $.isEmptyObject(options)) return;
        options = ConfigMethod.normalize(options);
        Config = $.extend(true, {}, ConfigMethod.defConfig, options);
    },

    /**
     * 写入设置
     */
    write: function () {
        var options = Tools.getDifferentValueOfObject(ConfigMethod.defConfig, Config);
        if (storageType === 'Script') GM_setValue(ConfigMethod.name + '_' + KFOL.uid, JSON.stringify(options));
        else if (storageType === 'Global') GM_setValue(ConfigMethod.name, JSON.stringify(options));
        else localStorage.setItem(ConfigMethod.name, JSON.stringify(options));
    },

    /**
     * 清空设置
     */
    clear: function () {
        if (storageType === 'Script') GM_deleteValue(ConfigMethod.name + '_' + KFOL.uid);
        else if (storageType === 'Global') GM_deleteValue(ConfigMethod.name);
        else localStorage.removeItem(ConfigMethod.name);
    },

    /**
     * 获取经过规范化的Config对象
     * @param {Config} options 待处理的Config对象
     * @returns {Config} 经过规范化的Config对象
     */
    normalize: function (options) {
        var settings = {};
        var defConfig = ConfigMethod.defConfig;
        if ($.type(options) !== 'object') return settings;

        if (typeof options.autoRefreshEnabled !== 'undefined') {
            settings.autoRefreshEnabled = typeof options.autoRefreshEnabled === 'boolean' ?
                options.autoRefreshEnabled : defConfig.autoRefreshEnabled;
        }
        if (typeof options.showRefreshModeTipsType !== 'undefined') {
            var showRefreshModeTipsType = $.trim(options.showRefreshModeTipsType).toLowerCase();
            var allowTypes = ['auto', 'always', 'never'];
            if (showRefreshModeTipsType !== '' && $.inArray(showRefreshModeTipsType, allowTypes) > -1)
                settings.showRefreshModeTipsType = showRefreshModeTipsType;
            else settings.showRefreshModeTipsType = defConfig.showRefreshModeTipsType;
        }

        if (typeof options.autoDonationEnabled !== 'undefined') {
            settings.autoDonationEnabled = typeof options.autoDonationEnabled === 'boolean' ?
                options.autoDonationEnabled : defConfig.autoDonationEnabled;
        }
        if (typeof options.donationKfb !== 'undefined') {
            var donationKfb = options.donationKfb;
            if ($.isNumeric(donationKfb) && donationKfb > 0 && donationKfb <= Const.maxDonationKfb)
                settings.donationKfb = parseInt(donationKfb);
            else if (/^1?\d?\d%$/.test(donationKfb) && parseInt(donationKfb) > 0 && parseInt(donationKfb) <= 100)
                settings.donationKfb = parseInt(donationKfb) + '%';
            else settings.donationKfb = defConfig.donationKfb;
        }
        if (typeof options.donationAfterTime !== 'undefined') {
            var donationAfterTime = options.donationAfterTime;
            if (/^(2[0-3]|[0-1][0-9]):[0-5][0-9]:[0-5][0-9]$/.test(donationAfterTime))
                settings.donationAfterTime = donationAfterTime;
            else settings.donationAfterTime = defConfig.donationAfterTime;
        }
        if (typeof options.deferLootTimeWhenRemainAttackNum !== 'undefined') {
            var attackNum = parseInt(options.deferLootTimeWhenRemainAttackNum);
            if (!isNaN(attackNum) && attackNum >= 1 && attackNum <= Const.maxAttackNum) settings.deferLootTimeWhenRemainAttackNum = attackNum;
            else settings.deferLootTimeWhenRemainAttackNum = defConfig.deferLootTimeWhenRemainAttackNum;
        }
        if (typeof options.autoLootEnabled !== 'undefined') {
            settings.autoLootEnabled = typeof options.autoLootEnabled === 'boolean' ?
                options.autoLootEnabled : defConfig.autoLootEnabled;
        }
        if (typeof options.noAutoLootWhen !== 'undefined') {
            if ($.isArray(options.noAutoLootWhen)) {
                settings.noAutoLootWhen = [];
                for (var i in options.noAutoLootWhen) {
                    var time = $.trim(options.noAutoLootWhen[i]);
                    if (/^(2[0-3]|[0-1][0-9]):[0-5][0-9]-(2[0-3]|[0-1][0-9]):[0-5][0-9]$/.test(time)) settings.noAutoLootWhen.push(time);
                }
            }
            else settings.noAutoLootWhen = defConfig.noAutoLootWhen;
        }
        if (typeof options.deferLootTimeWhenRemainAttackNumEnabled !== 'undefined') {
            settings.deferLootTimeWhenRemainAttackNumEnabled = typeof options.deferLootTimeWhenRemainAttackNumEnabled === 'boolean' ?
                options.deferLootTimeWhenRemainAttackNumEnabled : defConfig.deferLootTimeWhenRemainAttackNumEnabled;
        }

        if (typeof options.customMonsterNameEnabled !== 'undefined') {
            settings.customMonsterNameEnabled = typeof options.customMonsterNameEnabled === 'boolean' ?
                options.customMonsterNameEnabled : defConfig.customMonsterNameEnabled;
        }
        if (typeof options.customMonsterNameList !== 'undefined') {
            if ($.type(options.customMonsterNameList) === 'object') {
                settings.customMonsterNameList = {};
                for (var id in options.customMonsterNameList) {
                    id = parseInt(id);
                    var name = $.trim(options.customMonsterNameList[id]);
                    if (id >= 1 && id <= 5 && name !== '' && name.length <= 18) {
                        settings.customMonsterNameList[id] = name;
                    }
                }
            }
            else settings.customMonsterNameList = defConfig.customMonsterNameList;
        }
        if (typeof options.autoAttackEnabled !== 'undefined') {
            settings.autoAttackEnabled = typeof options.autoAttackEnabled === 'boolean' ?
                options.autoAttackEnabled : defConfig.autoAttackEnabled;
        }
        if (typeof options.attackAfterTime !== 'undefined') {
            var attackAfterTime = parseInt(options.attackAfterTime);
            if (!isNaN(attackAfterTime) && attackAfterTime >= Const.minAttackAfterTime && attackAfterTime <= Const.defLootInterval)
                settings.attackAfterTime = attackAfterTime;
            else settings.attackAfterTime = defConfig.attackAfterTime;
        }
        if (typeof options.attemptAttackEnabled !== 'undefined') {
            settings.attemptAttackEnabled = typeof options.attemptAttackEnabled === 'boolean' ?
                options.attemptAttackEnabled : defConfig.attemptAttackEnabled;
        }
        if (settings.attemptAttackEnabled && !settings.attackAfterTime) settings.attemptAttackEnabled = false;
        if (typeof options.batchAttackList !== 'undefined') {
            if ($.type(options.batchAttackList) === 'object') {
                settings.batchAttackList = {};
                var totalAttackNum = 0;
                for (var id in options.batchAttackList) {
                    var attackNum = parseInt(options.batchAttackList[id]);
                    if (!isNaN(attackNum) && attackNum > 0) {
                        settings.batchAttackList[parseInt(id)] = attackNum;
                        totalAttackNum += attackNum;
                    }
                }
                if (totalAttackNum > Const.maxAttackNum) settings.batchAttackList = defConfig.batchAttackList;
            }
            else settings.batchAttackList = defConfig.batchAttackList;
        }
        if (settings.autoAttackEnabled && (!settings.batchAttackList || $.isEmptyObject(settings.batchAttackList)))
            settings.autoAttackEnabled = false;
        if (typeof options.deadlyAttackId !== 'undefined') {
            var deadlyAttackId = parseInt(options.deadlyAttackId);
            if (!isNaN(deadlyAttackId) && deadlyAttackId >= 0 && deadlyAttackId <= 5) settings.deadlyAttackId = deadlyAttackId;
            else settings.deadlyAttackId = defConfig.deadlyAttackId;
        }
        if (typeof options.autoUseItemEnabled !== 'undefined') {
            settings.autoUseItemEnabled = typeof options.autoUseItemEnabled === 'boolean' ?
                options.autoUseItemEnabled : defConfig.autoUseItemEnabled;
        }
        if (typeof options.autoUseItemNames !== 'undefined') {
            var autoUseItemNames = options.autoUseItemNames;
            var allowTypes = ['被遗弃的告白信', '学校天台的钥匙', 'TMA最新作压缩包', 'LOLI的钱包', '棒棒糖', '蕾米莉亚同人漫画',
                '十六夜同人漫画', '档案室钥匙', '傲娇LOLI娇蛮音CD', '整形优惠卷', '消逝之药'];
            if ($.isArray(autoUseItemNames)) {
                settings.autoUseItemNames = [];
                for (var i in autoUseItemNames) {
                    if ($.inArray(autoUseItemNames[i], allowTypes) > -1) {
                        settings.autoUseItemNames.push(autoUseItemNames[i]);
                    }
                }
            }
            else settings.autoUseItemNames = defConfig.autoUseItemNames;
        }

        if (typeof options.autoDrawSmbox2Enabled !== 'undefined') {
            settings.autoDrawSmbox2Enabled = typeof options.autoDrawSmbox2Enabled === 'boolean' ?
                options.autoDrawSmbox2Enabled : defConfig.autoDrawSmbox2Enabled;
        }
        if (settings.autoDrawSmbox2Enabled && settings.autoLootEnabled) settings.autoDrawSmbox2Enabled = false;
        if (typeof options.favorSmboxNumbers !== 'undefined') {
            if ($.isArray(options.favorSmboxNumbers)) {
                settings.favorSmboxNumbers = [];
                for (var i in options.favorSmboxNumbers) {
                    var num = parseInt(options.favorSmboxNumbers[i]);
                    if (num >= 1 && num <= 400) settings.favorSmboxNumbers.push(num);
                }
            }
            else settings.favorSmboxNumbers = defConfig.favorSmboxNumbers;
        }

        if (typeof options.atTipsHandleType !== 'undefined') {
            var atTipsHandleType = $.trim(options.atTipsHandleType).toLowerCase();
            var allowTypes = ['no_highlight', 'no_highlight_extra', 'hide_box_1', 'hide_box_2', 'default', 'at_change_to_cao'];
            if (atTipsHandleType !== '' && $.inArray(atTipsHandleType, allowTypes) > -1)
                settings.atTipsHandleType = atTipsHandleType;
            else settings.atTipsHandleType = defConfig.atTipsHandleType;
        }
        if (typeof options.smLevelUpAlertEnabled !== 'undefined') {
            settings.smLevelUpAlertEnabled = typeof options.smLevelUpAlertEnabled === 'boolean' ?
                options.smLevelUpAlertEnabled : defConfig.smLevelUpAlertEnabled;
        }
        if (typeof options.fixedDepositDueAlertEnabled !== 'undefined') {
            settings.fixedDepositDueAlertEnabled = typeof options.fixedDepositDueAlertEnabled === 'boolean' ?
                options.fixedDepositDueAlertEnabled : defConfig.fixedDepositDueAlertEnabled;
        }
        if (typeof options.smRankChangeAlertEnabled !== 'undefined') {
            settings.smRankChangeAlertEnabled = typeof options.smRankChangeAlertEnabled === 'boolean' ?
                options.smRankChangeAlertEnabled : defConfig.smRankChangeAlertEnabled;
        }
        if (typeof options.homePageThreadFastGotoLinkEnabled !== 'undefined') {
            settings.homePageThreadFastGotoLinkEnabled = typeof options.homePageThreadFastGotoLinkEnabled === 'boolean' ?
                options.homePageThreadFastGotoLinkEnabled : defConfig.homePageThreadFastGotoLinkEnabled;
        }
        if (typeof options.showVipSurplusTimeEnabled !== 'undefined') {
            settings.showVipSurplusTimeEnabled = typeof options.showVipSurplusTimeEnabled === 'boolean' ?
                options.showVipSurplusTimeEnabled : defConfig.showVipSurplusTimeEnabled;
        }

        if (typeof options.showFastGotoThreadPageEnabled !== 'undefined') {
            settings.showFastGotoThreadPageEnabled = typeof options.showFastGotoThreadPageEnabled === 'boolean' ?
                options.showFastGotoThreadPageEnabled : defConfig.showFastGotoThreadPageEnabled;
        }
        if (typeof options.maxFastGotoThreadPageNum !== 'undefined') {
            var maxFastGotoThreadPageNum = parseInt(options.maxFastGotoThreadPageNum);
            if (!isNaN(maxFastGotoThreadPageNum) && maxFastGotoThreadPageNum > 0)
                settings.maxFastGotoThreadPageNum = maxFastGotoThreadPageNum;
            else settings.maxFastGotoThreadPageNum = defConfig.maxFastGotoThreadPageNum;
        }
        if (typeof options.perPageFloorNum !== 'undefined') {
            var perPageFloorNum = parseInt(options.perPageFloorNum);
            if ($.inArray(perPageFloorNum, [10, 20, 30]) > -1)
                settings.perPageFloorNum = perPageFloorNum;
            else settings.perPageFloorNum = defConfig.perPageFloorNum;
        }
        if (typeof options.highlightNewPostEnabled !== 'undefined') {
            settings.highlightNewPostEnabled = typeof options.highlightNewPostEnabled === 'boolean' ?
                options.highlightNewPostEnabled : defConfig.highlightNewPostEnabled;
        }

        if (typeof options.adjustThreadContentWidthEnabled !== 'undefined') {
            settings.adjustThreadContentWidthEnabled = typeof options.adjustThreadContentWidthEnabled === 'boolean' ?
                options.adjustThreadContentWidthEnabled : defConfig.adjustThreadContentWidthEnabled;
        }
        if (typeof options.threadContentFontSize !== 'undefined') {
            var threadContentFontSize = parseInt(options.threadContentFontSize);
            if (threadContentFontSize > 0) settings.threadContentFontSize = threadContentFontSize;
            else settings.threadContentFontSize = defConfig.threadContentFontSize;
        }
        if (typeof options.customMySmColor !== 'undefined') {
            var customMySmColor = options.customMySmColor;
            if (/^#[0-9a-fA-F]{6}$/.test(customMySmColor))
                settings.customMySmColor = customMySmColor;
            else settings.customMySmColor = defConfig.customMySmColor;
        }
        if (typeof options.customSmColorEnabled !== 'undefined') {
            settings.customSmColorEnabled = typeof options.customSmColorEnabled === 'boolean' ?
                options.customSmColorEnabled : defConfig.customSmColorEnabled;
        }
        if (typeof options.customSmColorConfigList !== 'undefined') {
            var customSmColorConfigList = options.customSmColorConfigList;
            if ($.isArray(customSmColorConfigList)) {
                settings.customSmColorConfigList = [];
                $.each(customSmColorConfigList, function (index, data) {
                    if ($.type(data) === 'object' && $.type(data.min) === 'string' && $.type(data.max) === 'string' && $.type(data.color) === 'string' &&
                        /^(-?\d+|MAX)$/i.test(data.min) && /^(-?\d+|MAX)$/i.test(data.max) && /^#[0-9a-fA-F]{6}$/.test(data.color) &&
                        Tools.compareSmLevel(data.min, data.max) <= 0) {
                        settings.customSmColorConfigList.push(data);
                    }
                });
            }
            else settings.customSmColorConfigList = defConfig.customSmColorConfigList;
        }
        if (typeof options.modifyKFOtherDomainEnabled !== 'undefined') {
            settings.modifyKFOtherDomainEnabled = typeof options.modifyKFOtherDomainEnabled === 'boolean' ?
                options.modifyKFOtherDomainEnabled : defConfig.modifyKFOtherDomainEnabled;
        }
        if (typeof options.multiQuoteEnabled !== 'undefined') {
            settings.multiQuoteEnabled = typeof options.multiQuoteEnabled === 'boolean' ?
                options.multiQuoteEnabled : defConfig.multiQuoteEnabled;
        }
        if (typeof options.batchBuyThreadEnabled !== 'undefined') {
            settings.batchBuyThreadEnabled = typeof options.batchBuyThreadEnabled === 'boolean' ?
                options.batchBuyThreadEnabled : defConfig.batchBuyThreadEnabled;
        }
        if (typeof options.userMemoEnabled !== 'undefined') {
            settings.userMemoEnabled = typeof options.userMemoEnabled === 'boolean' ?
                options.userMemoEnabled : defConfig.userMemoEnabled;
        }
        if (typeof options.userMemoList !== 'undefined') {
            if ($.type(options.userMemoList) === 'object') {
                settings.userMemoList = {};
                for (var user in options.userMemoList) {
                    var memo = $.trim(options.userMemoList[user]);
                    if (memo) settings.userMemoList[user] = memo;
                }
            }
            else settings.userMemoList = defConfig.userMemoList;
        }
        if (typeof options.parseMediaTagEnabled !== 'undefined') {
            settings.parseMediaTagEnabled = typeof options.parseMediaTagEnabled === 'boolean' ?
                options.parseMediaTagEnabled : defConfig.parseMediaTagEnabled;
        }

        if (typeof options.defShowMsgDuration !== 'undefined') {
            var defShowMsgDuration = parseInt(options.defShowMsgDuration);
            if (!isNaN(defShowMsgDuration) && defShowMsgDuration >= -1)
                settings.defShowMsgDuration = defShowMsgDuration;
            else settings.defShowMsgDuration = defConfig.defShowMsgDuration;
        }
        if (typeof options.animationEffectOffEnabled !== 'undefined') {
            settings.animationEffectOffEnabled = typeof options.animationEffectOffEnabled === 'boolean' ?
                options.animationEffectOffEnabled : defConfig.animationEffectOffEnabled;
        }
        if (typeof options.logSaveDays !== 'undefined') {
            var logSaveDays = parseInt(options.logSaveDays);
            if (logSaveDays > 0) settings.logSaveDays = logSaveDays;
            else settings.logSaveDays = defConfig.logSaveDays;
        }
        if (typeof options.showLogLinkInPageEnabled !== 'undefined') {
            settings.showLogLinkInPageEnabled = typeof options.showLogLinkInPageEnabled === 'boolean' ?
                options.showLogLinkInPageEnabled : defConfig.showLogLinkInPageEnabled;
        }
        if (typeof options.logSortType !== 'undefined') {
            var logSortType = $.trim(options.logSortType).toLowerCase();
            var allowTypes = ['time', 'type'];
            if (logSortType !== '' && $.inArray(logSortType, allowTypes) > -1)
                settings.logSortType = logSortType;
            else settings.logSortType = defConfig.logSortType;
        }
        if (typeof options.logStatType !== 'undefined') {
            var logStatType = $.trim(options.logStatType).toLowerCase();
            var allowTypes = ['cur', 'custom', 'all'];
            if (logStatType !== '' && $.inArray(logStatType, allowTypes) > -1)
                settings.logStatType = logStatType;
            else settings.logStatType = defConfig.logStatType;
        }
        if (typeof options.logStatDays !== 'undefined') {
            var logStatDays = parseInt(options.logStatDays);
            if (logStatDays > 0) settings.logStatDays = logStatDays;
            else settings.logStatDays = defConfig.logStatDays;
        }
        if (typeof options.addSideBarFastNavEnabled !== 'undefined') {
            settings.addSideBarFastNavEnabled = typeof options.addSideBarFastNavEnabled === 'boolean' ?
                options.addSideBarFastNavEnabled : defConfig.addSideBarFastNavEnabled;
        }
        if (typeof options.modifySideBarEnabled !== 'undefined') {
            settings.modifySideBarEnabled = typeof options.modifySideBarEnabled === 'boolean' ?
                options.modifySideBarEnabled : defConfig.modifySideBarEnabled;
        }
        if (typeof options.customCssEnabled !== 'undefined') {
            settings.customCssEnabled = typeof options.customCssEnabled === 'boolean' ?
                options.customCssEnabled : defConfig.customCssEnabled;
        }
        if (typeof options.customCssContent !== 'undefined') {
            var customCssContent = $.trim(options.customCssContent);
            if (customCssContent !== '') settings.customCssContent = customCssContent;
            else settings.customCssContent = defConfig.customCssContent;
        }
        if (typeof options.customScriptEnabled !== 'undefined') {
            settings.customScriptEnabled = typeof options.customScriptEnabled === 'boolean' ?
                options.customScriptEnabled : defConfig.customScriptEnabled;
        }
        if (typeof options.customScriptStartContent !== 'undefined') {
            if (typeof options.customScriptStartContent === 'string')
                settings.customScriptStartContent = options.customScriptStartContent;
            else
                settings.customScriptStartContent = defConfig.customScriptStartContent;
        }
        if (typeof options.customScriptEndContent !== 'undefined') {
            if (typeof options.customScriptEndContent === 'string')
                settings.customScriptEndContent = options.customScriptEndContent;
            else
                settings.customScriptEndContent = defConfig.customScriptEndContent;
        }
        if (typeof options.browseType !== 'undefined') {
            if ($.inArray(options.browseType.toLowerCase(), ['auto', 'desktop', 'mobile']) > -1)
                settings.browseType = options.browseType.toLowerCase();
            else settings.browseType = defConfig.options.browseType;
        }

        if (typeof options.followUserEnabled !== 'undefined') {
            settings.followUserEnabled = typeof options.followUserEnabled === 'boolean' ?
                options.followUserEnabled : defConfig.followUserEnabled;
        }
        if (typeof options.highlightFollowUserThreadInHPEnabled !== 'undefined') {
            settings.highlightFollowUserThreadInHPEnabled = typeof options.highlightFollowUserThreadInHPEnabled === 'boolean' ?
                options.highlightFollowUserThreadInHPEnabled : defConfig.highlightFollowUserThreadInHPEnabled;
        }
        if (typeof options.highlightFollowUserThreadLinkEnabled !== 'undefined') {
            settings.highlightFollowUserThreadLinkEnabled = typeof options.highlightFollowUserThreadLinkEnabled === 'boolean' ?
                options.highlightFollowUserThreadLinkEnabled : defConfig.highlightFollowUserThreadLinkEnabled;
        }
        if (typeof options.followUserList !== 'undefined') {
            if ($.isArray(options.followUserList)) {
                settings.followUserList = [];
                for (var i in options.followUserList) {
                    var user = options.followUserList[i];
                    if ($.type(user) === 'object' && $.type(user.name) === 'string') {
                        var name = $.trim(user.name);
                        if (name) settings.followUserList.push({name: name});
                    }
                    else if ($.type(user) === 'string') {
                        var name = $.trim(user);
                        if (name) settings.followUserList.push({name: name});
                    }
                }
            }
            else settings.followUserList = defConfig.followUserList;
        }

        if (typeof options.blockUserEnabled !== 'undefined') {
            settings.blockUserEnabled = typeof options.blockUserEnabled === 'boolean' ?
                options.blockUserEnabled : defConfig.blockUserEnabled;
        }
        if (typeof options.blockUserDefaultType !== 'undefined') {
            var blockUserDefaultType = parseInt(options.blockUserDefaultType);
            if (!isNaN(blockUserDefaultType) && blockUserDefaultType >= 0 && blockUserDefaultType <= 2) settings.blockUserDefaultType = blockUserDefaultType;
            else settings.blockUserDefaultType = defConfig.blockUserDefaultType;
        }
        if (typeof options.blockUserAtTipsEnabled !== 'undefined') {
            settings.blockUserAtTipsEnabled = typeof options.blockUserAtTipsEnabled === 'boolean' ?
                options.blockUserAtTipsEnabled : defConfig.blockUserAtTipsEnabled;
        }
        if (typeof options.blockUserForumType !== 'undefined') {
            var blockUserForumType = parseInt(options.blockUserForumType);
            if (!isNaN(blockUserForumType) && blockUserForumType >= 0 && blockUserForumType <= 2) settings.blockUserForumType = blockUserForumType;
            else settings.blockUserForumType = defConfig.blockUserForumType;
        }
        if (typeof options.blockUserFidList !== 'undefined') {
            if ($.isArray(options.blockUserFidList)) {
                settings.blockUserFidList = [];
                for (var i in options.blockUserFidList) {
                    var fid = parseInt(options.blockUserFidList[i]);
                    if (!isNaN(fid) && fid > 0) settings.blockUserFidList.push(fid);
                }
            }
            else settings.blockUserFidList = defConfig.blockUserFidList;
        }
        if (typeof options.blockUserList !== 'undefined') {
            if ($.isArray(options.blockUserList)) {
                settings.blockUserList = [];
                for (var i in options.blockUserList) {
                    var user = options.blockUserList[i];
                    if ($.type(user) === 'object' && $.type(user.name) === 'string' && $.type(user.type) === 'number') {
                        var type = user.type;
                        if (type < 0 || type > 2) type = Config.blockUserDefaultType;
                        var name = $.trim(user.name);
                        if (name) settings.blockUserList.push({name: name, type: type});
                    }
                    else if ($.type(user) === 'string') {
                        var name = $.trim(user);
                        if (name) settings.blockUserList.push({name: name, type: Config.blockUserDefaultType});
                    }
                }
            }
            else settings.blockUserList = defConfig.blockUserList;
        }
        if (typeof options.blockThreadEnabled !== 'undefined') {
            settings.blockThreadEnabled = typeof options.blockThreadEnabled === 'boolean' ?
                options.blockThreadEnabled : defConfig.blockThreadEnabled;
        }
        if (typeof options.blockThreadDefForumType !== 'undefined') {
            var blockThreadDefForumType = parseInt(options.blockThreadDefForumType);
            if (!isNaN(blockThreadDefForumType) && blockThreadDefForumType >= 0 && blockThreadDefForumType <= 2) settings.blockThreadDefForumType = blockThreadDefForumType;
            else settings.blockThreadDefForumType = defConfig.blockThreadDefForumType;
        }
        if (typeof options.blockThreadDefFidList !== 'undefined') {
            if ($.isArray(options.blockThreadDefFidList)) {
                settings.blockThreadDefFidList = [];
                for (var i in options.blockThreadDefFidList) {
                    var fid = parseInt(options.blockThreadDefFidList[i]);
                    if (!isNaN(fid) && fid > 0) settings.blockThreadDefFidList.push(fid);
                }
            }
            else settings.blockThreadDefFidList = defConfig.blockThreadDefFidList;
        }
        if (typeof options.blockThreadList !== 'undefined') {
            if ($.isArray(options.blockThreadList)) {
                settings.blockThreadList = [];
                for (var i in options.blockThreadList) {
                    var obj = options.blockThreadList[i];
                    if ($.type(obj) === 'object' && $.type(obj.keyWord) === 'string' && $.trim(obj.keyWord) !== '') {
                        var newObj = {keyWord: obj.keyWord};
                        var userNameList = [];
                        if ($.isArray(obj.userName)) {
                            for (var j in obj.userName) {
                                var userName = $.trim(obj.userName[j]);
                                if (userName) userNameList.push(userName);
                            }
                        }
                        if (userNameList.length > 0) newObj.userName = userNameList;
                        var includeFid = [], excludeFid = [];
                        if ($.isArray(obj.includeFid)) {
                            for (var j in obj.includeFid) {
                                var fid = parseInt(obj.includeFid[j]);
                                if (!isNaN(fid) && fid > 0) includeFid.push(fid);
                            }
                        }
                        else if ($.isArray(obj.excludeFid)) {
                            for (var j in obj.excludeFid) {
                                var fid = parseInt(obj.excludeFid[j]);
                                if (!isNaN(fid) && fid > 0) excludeFid.push(fid);
                            }
                        }
                        if (includeFid.length > 0) newObj.includeFid = includeFid;
                        else if (excludeFid.length > 0) newObj.excludeFid = excludeFid;
                        settings.blockThreadList.push(newObj);
                    }
                }
            }
            else settings.blockThreadList = defConfig.blockThreadList;
        }

        if (typeof options.autoSaveCurrentDepositEnabled !== 'undefined') {
            settings.autoSaveCurrentDepositEnabled = typeof options.autoSaveCurrentDepositEnabled === 'boolean' ?
                options.autoSaveCurrentDepositEnabled : defConfig.autoSaveCurrentDepositEnabled;
        }
        if (typeof options.saveCurrentDepositAfterKfb !== 'undefined') {
            var saveCurrentDepositAfterKfb = parseInt(options.saveCurrentDepositAfterKfb);
            if (saveCurrentDepositAfterKfb > 0) settings.saveCurrentDepositAfterKfb = saveCurrentDepositAfterKfb;
            else settings.saveCurrentDepositAfterKfb = defConfig.saveCurrentDepositAfterKfb;
        }
        if (typeof options.saveCurrentDepositKfb !== 'undefined') {
            var saveCurrentDepositKfb = parseInt(options.saveCurrentDepositKfb);
            if (saveCurrentDepositKfb > 0 && saveCurrentDepositKfb <= settings.saveCurrentDepositAfterKfb)
                settings.saveCurrentDepositKfb = saveCurrentDepositKfb;
            else settings.saveCurrentDepositKfb = defConfig.saveCurrentDepositKfb;
        }

        if (typeof options.autoChangeSMColorEnabled !== 'undefined') {
            settings.autoChangeSMColorEnabled = typeof options.autoChangeSMColorEnabled === 'boolean' ?
                options.autoChangeSMColorEnabled : defConfig.autoChangeSMColorEnabled;
        }
        if (typeof options.autoChangeSMColorType !== 'undefined') {
            var autoChangeSMColorType = $.trim(options.autoChangeSMColorType).toLowerCase();
            var allowTypes = ['random', 'sequence'];
            if (autoChangeSMColorType !== '' && $.inArray(autoChangeSMColorType, allowTypes) > -1)
                settings.autoChangeSMColorType = autoChangeSMColorType;
            else settings.autoChangeSMColorType = defConfig.autoChangeSMColorType;
        }
        if (typeof options.autoChangeSMColorInterval !== 'undefined') {
            var autoChangeSMColorInterval = parseInt(options.autoChangeSMColorInterval);
            if (!isNaN(autoChangeSMColorInterval) && autoChangeSMColorInterval > 0) settings.autoChangeSMColorInterval = autoChangeSMColorInterval;
            else settings.autoChangeSMColorInterval = defConfig.autoChangeSMColorInterval;
        }
        if (typeof options.changeAllAvailableSMColorEnabled !== 'undefined') {
            settings.changeAllAvailableSMColorEnabled = typeof options.changeAllAvailableSMColorEnabled === 'boolean' ?
                options.changeAllAvailableSMColorEnabled : defConfig.changeAllAvailableSMColorEnabled;
        }
        if (typeof options.customAutoChangeSMColorList !== 'undefined') {
            if ($.isArray(options.customAutoChangeSMColorList)) {
                settings.customAutoChangeSMColorList = [];
                for (var i in options.customAutoChangeSMColorList) {
                    var id = parseInt(options.customAutoChangeSMColorList[i]);
                    if (!isNaN(id) && id >= 1 && id <= 20) {
                        settings.customAutoChangeSMColorList.push(id);
                    }
                }
            }
            else settings.customAutoChangeSMColorList = defConfig.customAutoChangeSMColorList;
        }

        return settings;
    }
};

/**
 * 工具类
 */
var Tools = {
    /**
     * 设置Cookie
     * @param {string} name Cookie名称
     * @param {*} value Cookie值
     * @param {?Date} [date] Cookie有效期，为空则表示有效期为浏览器进程关闭
     * @param {string} [prefix] Cookie名称前缀，留空则表示使用{@link KFOL.uid}前缀
     */
    setCookie: function (name, value, date, prefix) {
        document.cookie = '{0}{1}={2}{3};path=/;'
            .replace('{0}', typeof prefix === 'undefined' || prefix === null ? KFOL.uid + '_' : prefix)
            .replace('{1}', name)
            .replace('{2}', encodeURI(value))
            .replace('{3}', !date ? '' : ';expires=' + date.toUTCString());
    },

    /**
     * 获取Cookie
     * @param {string} name Cookie名称
     * @param {string} [prefix] Cookie名称前缀，留空则表示使用{@link KFOL.uid}前缀
     * @returns {?string} Cookie值
     */
    getCookie: function (name, prefix) {
        var regex = new RegExp('(^| ){0}{1}=([^;]*)(;|$)'
            .replace('{0}', typeof prefix === 'undefined' || prefix === null ? KFOL.uid + '_' : prefix)
            .replace('{1}', name)
        );
        var matches = document.cookie.match(regex);
        if (!matches) return null;
        else return decodeURI(matches[2]);
    },

    /**
     * 返回当天指定时间的Date对象
     * @param {string} time 指定的时间（例：22:30:00）
     * @returns {Date} 指定时间的Date对象
     */
    getDateByTime: function (time) {
        var date = new Date();
        var timeArr = time.split(':');
        if (timeArr[0]) date.setHours(parseInt(timeArr[0]));
        if (timeArr[1]) date.setMinutes(parseInt(timeArr[1]));
        if (timeArr[2]) date.setSeconds(parseInt(timeArr[2]));
        date.setMilliseconds(0);
        return date;
    },

    /**
     * 返回当天根据指定时区指定时间的Date对象
     * @param {string} time 指定的时间（例：22:30:00）
     * @param {number} [timezoneOffset={@link Const.forumTimezoneOffset}] UTC时间与本地时间之间的时间差（例：东8区为-8）
     * @returns {Date} 指定时间的Date对象
     */
    getTimezoneDateByTime: function (time, timezoneOffset) {
        if (typeof timezoneOffset === 'undefined') timezoneOffset = Const.forumTimezoneOffset;
        var date = new Date();
        var timeArr = time.split(':');
        if (timeArr[0]) date.setUTCHours(parseInt(timeArr[0]) + timezoneOffset);
        if (timeArr[1]) date.setUTCMinutes(parseInt(timeArr[1]));
        if (timeArr[2]) date.setUTCSeconds(parseInt(timeArr[2]));
        date.setUTCMilliseconds(0);
        var now = new Date();
        if (now.getDate() > date.getDate() || now.getMonth() > date.getMonth() || now.getFullYear() > date.getFullYear()) {
            date.setDate(date.getDate() + 1);
        }
        return date;
    },

    /**
     * 获取距今N天的零时整点的Date对象
     * @param {number} days 距今的天数
     * @returns {Date} 距今N天的零时整点的Date对象
     */
    getMidnightHourDate: function (days) {
        var date = Tools.getDateByTime('00:00:00');
        date.setDate(date.getDate() + days);
        return date;
    },

    /**
     * 获取在当前时间的基础上的指定（相对）时间量的Date对象
     * @param {string} value 指定（相对）时间量，+或-：之后或之前（相对于当前时间）；无符号：绝对值；Y：完整年份；y：年；M：月；d：天；h：小时；m：分；s：秒；ms：毫秒
     * @returns {?Date} 指定（相对）时间量的Date对象
     * @example
     * Tools.getDate('+2y') 获取2年后的Date对象
     * Tools.getDate('+3M') 获取3个月后的Date对象
     * Tools.getDate('-4d') 获取4天前的Date对象
     * Tools.getDate('5h') 获取今天5点的Date对象（其它时间量与当前时间一致）
     * Tools.getDate('2015Y') 获取年份为2015年的Date对象
     */
    getDate: function (value) {
        var date = new Date();
        var matches = /^(-|\+)?(\d+)([a-zA-Z]{1,2})$/.exec(value);
        if (!matches) return null;
        var flag = typeof matches[1] === 'undefined' ? 0 : (matches[1] === '+' ? 1 : -1);
        var increment = flag === -1 ? -parseInt(matches[2]) : parseInt(matches[2]);
        var unit = matches[3];
        switch (unit) {
            case 'Y':
                date.setFullYear(increment);
                break;
            case 'y':
                date.setYear(flag === 0 ? increment : date.getYear() + increment);
                break;
            case 'M':
                date.setMonth(flag === 0 ? increment : date.getMonth() + increment);
                break;
            case 'd':
                date.setDate(flag === 0 ? increment : date.getDate() + increment);
                break;
            case 'h':
                date.setHours(flag === 0 ? increment : date.getHours() + increment);
                break;
            case 'm':
                date.setMinutes(flag === 0 ? increment : date.getMinutes() + increment);
                break;
            case 's':
                date.setSeconds(flag === 0 ? increment : date.getSeconds() + increment);
                break;
            case 'ms':
                date.setMilliseconds(flag === 0 ? increment : date.getMilliseconds() + increment);
                break;
            default:
                return null;
        }
        return date;
    },

    /**
     * 获取指定Date对象的日期字符串
     * @param {?Date} [date] 指定Date对象，留空表示现在
     * @param {string} [separator='-'] 分隔符，留空表示使用“-”作为分隔符
     * @returns {string} 日期字符串
     */
    getDateString: function (date, separator) {
        date = date ? date : new Date();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        return '{0}{3}{1}{3}{2}'
            .replace('{0}', date.getFullYear())
            .replace('{1}', month < 10 ? '0' + month : month)
            .replace('{2}', day < 10 ? '0' + day : day)
            .replace(/\{3\}/g, typeof separator !== 'undefined' ? separator : '-');
    },

    /**
     * 获取指定Date对象的时间字符串
     * @param {?Date} [date] 指定Date对象，留空表示现在
     * @param {string} [separator=':'] 分隔符，留空表示使用“:”作为分隔符
     * @param {boolean} [isShowSecond=true] 是否显示秒钟
     * @returns {string} 时间字符串
     */
    getTimeString: function (date, separator, isShowSecond) {
        date = date ? date : new Date();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var second = date.getSeconds();
        var sep = typeof separator !== 'undefined' ? separator : ':';
        isShowSecond = $.type(isShowSecond) === 'boolean' ? isShowSecond : true;
        return '{0}{3}{1}{4}{2}'
            .replace('{0}', hour < 10 ? '0' + hour : hour)
            .replace('{1}', minute < 10 ? '0' + minute : minute)
            .replace('{2}', isShowSecond ? (second < 10 ? '0' + second : second) : '')
            .replace('{3}', sep)
            .replace('{4}', isShowSecond ? sep : '');
    },

    /**
     * 获取指定时间戳距现在所剩余时间的描述
     * @param {number} timestamp 指定时间戳
     * @returns {{hours: number, minutes: number, seconds: number}} 剩余时间的描述，hours：剩余的小时数；minutes：剩余的分钟数；seconds：剩余的秒数
     */
    getTimeDiffInfo: function (timestamp) {
        var diff = timestamp - new Date().getTime();
        if (diff > 0) {
            diff = Math.floor(diff / 1000);
            var hours = Math.floor(diff / 60 / 60);
            if (hours >= 0) {
                var minutes = Math.floor((diff - hours * 60 * 60) / 60);
                if (minutes < 0) minutes = 0;
                var seconds = Math.floor(diff - hours * 60 * 60 - minutes * 60);
                if (seconds < 0) seconds = 0;
                return {hours: hours, minutes: minutes, seconds: seconds};
            }
        }
        return {hours: 0, minutes: 0, seconds: 0};
    },

    /**
     * 判断指定时间是否处于规定时间段内
     * @param {Date} time 指定时间
     * @param {string} range 规定时间段，例：'08:00:15-15:30:30'或'23:30-01:20'
     * @returns {?boolean} 是否处于规定时间段内，返回null表示规定时间段格式不正确
     */
    isBetweenInTimeRange: function (time, range) {
        var rangeArr = range.split('-');
        if (rangeArr.length !== 2) return null;
        var start = Tools.getDateByTime(rangeArr[0]);
        var end = Tools.getDateByTime(rangeArr[1]);
        if (end < start) {
            if (time > end) end.setDate(end.getDate() + 1);
            else start.setDate(start.getDate() - 1);
        }
        return time >= start && time <= end;
    },

    /**
     * 获取当前域名的URL
     * @returns {string} 当前域名的URL
     */
    getHostNameUrl: function () {
        return '{0}//{1}/'.replace('{0}', location.protocol).replace('{1}', location.host);
    },

    /**
     * 获取B对象中与A对象拥有同样字段并且值不同的新对象
     * @param {Object} a 对象A
     * @param {Object} b 对象B
     * @returns {Object} 新的对象
     */
    getDifferentValueOfObject: function (a, b) {
        var c = {};
        if ($.type(a) !== 'object' || $.type(b) !== 'object') return c;
        $.each(b, function (index, key) {
            if (typeof a[index] !== 'undefined') {
                if (!Tools.deepEqual(a[index], key)) c[index] = key;
            }
        });
        return c;
    },

    /**
     * 深度比较两个对象是否相等
     * @param {*} a
     * @param {*} b
     * @returns {boolean} 是否相等
     */
    deepEqual: function (a, b) {
        if (a === b) return true;
        if ($.type(a) !== $.type(b)) return false;
        if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) return true;
        if ($.isArray(a) && $.isArray(b) || $.type(a) === 'object' && $.type(b) === 'object') {
            if (a.length !== b.length) return false;
            var c = $.extend($.isArray(a) ? [] : {}, a, b);
            for (var i in c) {
                if (typeof a[i] === 'undefined' || typeof b[i] === 'undefined') return false;
                if (!Tools.deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        return false;
    },

    /**
     * 获取URL中的指定参数
     * @param {string} name 参数名称
     * @returns {?string} URL中的指定参数
     */
    getUrlParam: function (name) {
        var regex = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
        var matches = location.search.substr(1).match(regex);
        if (matches) return decodeURI(matches[2]);
        else return null;
    },

    /**
     * 获取经过GBK编码后的字符串
     * @param {string} str 待编码的字符串
     * @returns {string} 经过GBK编码后的字符串
     */
    getGBKEncodeString: function (str) {
        var img = $('<img />').appendTo('body').get(0);
        img.src = 'nothing?sp=' + str;
        var encodeStr = img.src.split('nothing?sp=').pop();
        $(img).remove();
        return encodeStr;
    },

    /**
     * HTML转义编码
     * @param {string} str 待编码的字符串
     * @returns {string} 编码后的字符串
     */
    htmlEncode: function (str) {
        if (str.length === 0) return '';
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/ /g, '&nbsp;')
            .replace(/\'/g, '&#39;')
            .replace(/\"/g, '&quot;')
            .replace(/\n/g, '<br/>');
    },

    /**
     * HTML转义解码
     * @param {string} str 待解码的字符串
     * @returns {string} 解码后的字符串
     */
    htmlDecode: function (str) {
        if (str.length === 0) return '';
        return str.replace(/<br\s*\/?>/gi, '\n')
            .replace(/&quot;/gi, '\"')
            .replace(/&#39;/gi, '\'')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&gt;/gi, '>')
            .replace(/&lt;/gi, '<')
            .replace(/&amp;/gi, '&');
    },

    /**
     * 获取指定对象的关键字列表
     * @param {Object} obj 指定对象
     * @param {number} [sortBy] 是否排序，0：不排序；1：升序；-1：降序
     * @returns {string[]} 关键字列表
     */
    getObjectKeyList: function (obj, sortBy) {
        var list = [];
        if ($.type(obj) !== 'object') return list;
        for (var key in obj) {
            list.push(key);
        }
        if (sortBy != 0) {
            list.sort(function (a, b) {
                return sortBy > 0 ? a > b : a < b;
            });
        }
        return list;
    },

    /**
     * 获取经过格式化的统计数字字符串
     * @param {number} num 待处理的数字
     * @returns {string} 经过格式化的数字字符串
     */
    getStatFormatNumber: function (num) {
        var result = '';
        if (num >= 0) result = '<em>+{0}</em>'.replace('{0}', num.toLocaleString());
        else result = '<ins>{0}</ins>'.replace('{0}', num.toLocaleString());
        return result;
    },

    /**
     * 检测浏览器是否为Opera
     * @returns {boolean} 是否为Opera
     */
    isOpera: function () {
        return typeof window.opera !== 'undefined';
    },

    /**
     * 检测浏览器是否为Edge
     * @returns {boolean} 是否为Edge
     */
    isEdge: function () {
        return navigator.appVersion && navigator.appVersion.indexOf('Edge') > 0;
    },

    /**
     * 比较神秘等级高低
     * @param {string} a
     * @param {string} b
     * @returns {number} 比较结果，-1：a小于b；0：a等于b；1：a大于b
     */
    compareSmLevel: function (a, b) {
        var x = a.toUpperCase() === 'MAX' ? 99999999 : parseInt(a);
        var y = b.toUpperCase() === 'MAX' ? 99999999 : parseInt(b);
        if (x > y) return 1;
        else if (x < y) return -1;
        else return 0;
    },

    /**
     * 获取指定用户名在关注或屏蔽列表中的索引号
     * @param {string} name 指定用户名
     * @param {Array} list 指定列表
     * @returns {number} 指定用户在列表中的索引号，-1表示不在该列表中
     */
    inFollowOrBlockUserList: function (name, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].name && list[i].name === name) return i;
        }
        return -1;
    },

    /**
     * 获取帖子当前所在的页数
     * @returns {number} 帖子当前所在的页数
     */
    getCurrentThreadPage: function () {
        var matches = /- (\d+) -/.exec($('.pages:first > li > a[href="javascript:;"]').text());
        return matches ? parseInt(matches[1]) : 1;
    },

    /**
     * 获取指定小数位的本地字符串
     * @param {number} num 数字
     * @param {number} [digit=0] 指定小数位
     * @returns {string} 指定小数位的本地字符串
     */
    getFixedNumberLocaleString: function (num, digit) {
        if (!digit || digit < 0) digit = 0;
        var arr = num.toFixed(digit).split('.');
        var integerStr = parseInt(arr[0]).toLocaleString();
        var decimalStr = '';
        if (typeof arr[1] !== 'undefined') decimalStr = '.' + arr[1];
        return integerStr + decimalStr;
    },

    /**
     * 获取去除了不配对BBCode的引用内容
     * @param {string} content 引用内容
     * @returns {string} 去除了不配对BBCode的引用内容
     */
    getRemoveUnpairedBBCodeQuoteContent: function (content) {
        var startCodeList = [/\[color=.+?\]/g, /\[backcolor=.+?\]/g, /\[size=.+?\]/g, /\[font=.+?\]/g, /\[b\]/g, /\[i\]/g, /\[u\]/g, /\[strike\]/g];
        var endCodeList = [/\[\/color\]/g, /\[\/backcolor\]/g, /\[\/size\]/g, /\[\/font\]/g, /\[\/b\]/g, /\[\/i\]/g, /\[\/u\]/g, /\[\/strike\]/g];
        for (var i = 0; i < startCodeList.length; i++) {
            var startMatches = content.match(startCodeList[i]);
            var endMatches = content.match(endCodeList[i]);
            var startMatchesNum = startMatches ? startMatches.length : 0;
            var endMatchesNum = endMatches ? endMatches.length : 0;
            if (startMatchesNum !== endMatchesNum) {
                content = content.replace(startCodeList[i], '').replace(endCodeList[i], '');
            }
        }
        return content;
    },

    /**
     * 转换为可外链的音频URL
     * @param {string} url 音频原URL
     * @returns {string} 音频外链URL
     */
    convertToAudioExternalLinkUrl: function (url) {
        var matches = /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)/i.exec(url);
        if (matches) url = 'http://music.miaola.info/163/{0}.mp3'.replace('{0}', matches[1]);
        return url;
    }
};

/**
 * 自定义方法类
 */
var Func = {
    // 自定义方法列表
    funcList: {},

    /**
     * 添加自定义方法
     * @param {string} name 自定义方法名称
     * @param {function} func 自定义方法
     */
    add: function (name, func) {
        name = name.replace(/\./g, '_');
        if (typeof Func.funcList[name] === 'undefined') Func.funcList[name] = [];
        Func.funcList[name].push(func);
    },

    /**
     * 执行自定义方法
     * @param {string} name 自定义方法名称
     * @param {*} [data] 自定义方法参数
     * @returns {boolean} 是否执行了自定义方法
     */
    run: function (name, data) {
        name = name.replace(/\./g, '_');
        if (typeof Func.funcList[name] !== 'undefined') {
            for (var i in Func.funcList[name]) {
                if (typeof Func.funcList[name][i] === 'function')
                    Func.funcList[name][i](data);
            }
            return true;
        }
        else return false;
    }
};

/**
 * 对话框类
 */
var Dialog = {
    /**
     * 创建对话框
     * @param {string} id 对话框ID
     * @param {string} title 对话框标题
     * @param {string} content 对话框内容
     * @param {string} [style] 对话框样式
     * @returns {jQuery} 对话框的jQuery对象
     */
    create: function (id, title, content, style) {
        var html =
            '<form>' +
            '<div class="pd_cfg_box" id="{0}" style="{1}">'.replace('{0}', id).replace('{1}', style ? style : '') +
            '  <h1>{0}<span>&times;</span></h1>'.replace('{0}', title) +
            content +
            '</div>' +
            '</form>';
        var $dialog = $(html).appendTo('body');
        $dialog.on('click', '.pd_cfg_tips', function (e) {
            if (KFOL.isMobile) KFOL.showElementTitleTips(e, this.title);
            return false;
        }).on('click', 'a.pd_disabled_link', function () {
            return false;
        }).keydown(function (e) {
            if (e.keyCode === 27) {
                return Dialog.close(id);
            }
        }).find('h1 > span').click(function () {
            return Dialog.close(id);
        }).end().find('legend input[type="checkbox"]').click(function () {
            var $this = $(this);
            var checked = $this.prop('checked');
            if (Tools.isOpera() || Tools.isEdge())
                $this.closest('fieldset').find('input, select, textarea, button').not('legend input').prop('disabled', !checked);
            else
                $this.closest('fieldset').prop('disabled', !checked);
        }).end().find('input[data-disabled]').click(function () {
            var $this = $(this);
            var checked = $this.prop('checked');
            $($this.data('disabled')).each(function () {
                var $this = $(this);
                if ($this.is('a')) {
                    if (checked) $this.removeClass('pd_disabled_link');
                    else $this.addClass('pd_disabled_link');
                }
                else {
                    $this.prop('disabled', !checked);
                }
            });
        });
        if (!KFOL.isMobile) {
            $(window).on('resize.' + id, function () {
                Dialog.show(id);
            });
        }
        return $dialog;
    },

    /**
     * 显示或调整对话框
     * @param {string} id 对话框ID
     */
    show: function (id) {
        var $box = $('#' + id);
        if ($box.length === 0) return;
        $box.find('.pd_cfg_main').css('max-height', $(window).height() - 80)
            .end().find('legend input[type="checkbox"]').each(function () {
            $(this).triggerHandler('click');
        }).end().find('input[data-disabled]').each(function () {
            $(this).triggerHandler('click');
        });
        var boxWidth = $box.width(), windowWidth = $(window).width(), windowHeight = $(window).height();
        if (KFOL.isMobile && windowHeight > 1000) windowHeight /= 2;
        var scrollTop = $(window).scrollTop();
        if (scrollTop < windowHeight / 2) scrollTop = 0;
        var left = windowWidth / 2 + (KFOL.isMobile ? $(window).scrollLeft() / 3 : 0) - boxWidth / 2;
        if (left + boxWidth > windowWidth) left = windowWidth - boxWidth - 20;
        $box.css('top', windowHeight / 2 + (KFOL.isMobile ? scrollTop : 0) - $box.height() / 2)
            .css('left', left)
            .fadeIn('fast');
    },

    /**
     * 关闭对话框
     * @param {string} id 对话框ID
     * @returns {boolean} 返回false
     */
    close: function (id) {
        $('#' + id).fadeOut('fast', function () {
            $(this).parent('form').remove();
        });
        if (!KFOL.isMobile) {
            $(window).off('resize.' + id);
        }
        return false;
    }
};

/**
 * 设置对话框类
 */
var ConfigDialog = {
    /**
     * 显示设置对话框
     */
    show: function () {
        if ($('#pd_config').length > 0) return;
        ConfigMethod.read();
        var html =
            '<div class="pd_cfg_main">' +
            '  <div class="pd_cfg_nav">' +
            '    <a title="清除与助手有关的Cookies和本地存储数据（不包括助手设置和日志）" href="#">清除缓存</a>' +
            '    <a href="#">运行命令</a>' +
            '    <a href="#">查看日志</a>' +
            '    <a href="#">导入/导出设置</a>' +
            '  </div>' +
            '  <div class="pd_cfg_panel" style="margin-bottom:5px">' +
            '    <fieldset>' +
            '      <legend><label><input id="pd_cfg_auto_refresh_enabled" type="checkbox" />定时模式 ' +
            '<span class="pd_cfg_tips" title="可按时进行自动操作（包括捐款、争夺、抽取神秘盒子，需开启相关功能），只在论坛首页生效">[?]</span></label></legend>' +
            '      <label>标题提示方案<select id="pd_cfg_show_refresh_mode_tips_type"><option value="auto">停留一分钟后显示</option>' +
            '<option value="always">总是显示</option><option value="never">不显示</option></select>' +
            '<span class="pd_cfg_tips" title="在首页的网页标题上显示定时模式提示的方案">[?]</span></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend><label><input id="pd_cfg_auto_donation_enabled" type="checkbox" />自动KFB捐款</label></legend>' +
            '      <label>KFB捐款额度<input id="pd_cfg_donation_kfb" maxlength="4" style="width:32px" type="text" />' +
            '<span class="pd_cfg_tips" title="取值范围在1-5000的整数之间；可设置为百分比，表示捐款额度为当前收入的百分比（最多不超过5000KFB），例：80%">[?]</span></label>' +
            '      <label style="margin-left:10px">在<input id="pd_cfg_donation_after_time" maxlength="8" style="width:55px" type="text" />' +
            '之后捐款 <span class="pd_cfg_tips" title="在当天的指定时间之后捐款（24小时制），例：22:30:00（注意不要设置得太接近零点，以免错过捐款）">[?]</span></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend><label><input id="pd_cfg_auto_loot_enabled" type="checkbox" />自动争夺 ' +
            '<span class="pd_cfg_tips" title="可自动领取争夺奖励，并可自动进行批量攻击（可选）">[?]</span></label></legend>' +
            '      <label>在<input placeholder="例：07:00-08:15,17:00-18:15" id="pd_cfg_no_auto_loot_when" maxlength="23" style="width:150px" type="text" />内不自动领取争夺奖励 ' +
            '<span class="pd_cfg_tips" title="在指定的时间段内不自动领取争夺奖励（主要与在指定时间内才攻击配合使用），例：07:00-08:15,17:00-18:15，留空表示不启用">[?]</span>' +
            '</label><br />' +
            '      <label><input id="pd_cfg_defer_loot_time_when_remain_attack_num_enabled" type="checkbox" data-disabled="#pd_cfg_defer_loot_time_when_remain_attack_num" />' +
            '在剩余攻击次数不低于</label><label><input id="pd_cfg_defer_loot_time_when_remain_attack_num" maxlength="2" style="width:15px" type="text" />次时，抽盒子延长争夺时间 ' +
            '<span class="pd_cfg_tips" title="在领取争夺奖励时，当本回合剩余攻击次数不低于指定次数的情况下，抽取神秘盒子以延长争夺时间">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_custom_monster_name_enabled" type="checkbox" data-disabled="#pd_cfg_custom_monster_name_dialog" />自定义怪物名称 ' +
            '<span class="pd_cfg_tips" title="自定义怪物名称，请点击详细设置自定义各怪物的名称">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_custom_monster_name_dialog" href="#">详细设置&raquo;</a>' +
            '      <fieldset>' +
            '        <legend><label><input id="pd_cfg_auto_attack_enabled" type="checkbox" />自动攻击 ' +
            '<span class="pd_cfg_tips" title="在自动领取争夺奖励后，自动进行批量攻击（需指定攻击目标）">[?]</span></label></legend>' +
            '      <label>在距本回合结束前<input id="pd_cfg_attack_after_time" maxlength="3" style="width:23px" type="text" />分钟内才完成(剩余)攻击 ' +
            '<span class="pd_cfg_tips" title="在距本回合结束前指定时间内才自动完成(剩余)批量攻击，取值范围：{0}-{1}，留空表示不启用">[?]</span></label><br />'
                .replace('{0}', Const.defLootInterval).replace('{1}', Const.minAttackAfterTime) +
            '      <label><input id="pd_cfg_attempt_attack_enabled" type="checkbox" />在生命值不超过{0}时进行试探攻击 '.replace('{0}', Const.maxAttemptAttackLifeNum) +
            '<span class="pd_cfg_tips" title="当实际生命值不超过指定值时自动进行试探攻击，需同时设置在距本回合结束前指定分钟内才完成(剩余)攻击，详见【常见问题10】">[?]</span></label>' +
            '        <table id="pd_cfg_batch_attack_list">' +
            '          <tbody>' +
            '            <tr><td style="width:110px">Lv.1：小史莱姆</td><td style="width:70px"><label><input style="width:15px" type="text" maxlength="2" data-id="1" />次' +
            '</label></td><td style="width:62px">Lv.2：笨蛋</td><td><label><input style="width:15px" type="text" maxlength="2" data-id="2" />次</label></td></tr>' +
            '            <tr><td>Lv.3：大果冻史莱姆</td><td><label><input style="width:15px" type="text" maxlength="2" data-id="3" />次</label></td>' +
            '<td>Lv.4：肉山</td><td><label><input style="width:15px" type="text" maxlength="2" data-id="4" />次</label></td></tr>' +
            '            <tr><td>Lv.5：大魔王</td><td><label><input style="width:15px" type="text" maxlength="2" data-id="5" />次</label></td></tr>' +
            '          </tbody>' +
            '        </table>' +
            '        <label>拥有致命一击时的攻击目标<select id="pd_cfg_deadly_attack_id" style="width:130px"><option value="0">保持默认</option>' +
            '<option value="1">Lv.1：小史莱姆</option><option value="2">Lv.2：笨蛋</option><option value="3">Lv.3：大果冻史莱姆</option><option value="4">Lv.4：肉山</option>' +
            '<option value="5">Lv.5：大魔王</option></select><span class="pd_cfg_tips" title="当拥有致命一击时的自动攻击目标">[?]</span></label>' +
            '      </fieldset>' +
            '      <label><input id="pd_cfg_auto_use_item_enabled" type="checkbox" data-disabled="#pd_cfg_auto_use_item_names" />自动使用刚掉落的道具 ' +
            '<span class="pd_cfg_tips" title="自动使用批量攻击后刚掉落的道具，需指定自动使用的道具名称，按Shift或Ctrl键可多选">[?]</span></label><br />' +
            '      <label><select id="pd_cfg_auto_use_item_names" multiple="multiple" size="4">' +
            '<option value="被遗弃的告白信">Lv.1：被遗弃的告白信</option><option value="学校天台的钥匙">Lv.1：学校天台的钥匙</option>' +
            '<option value="TMA最新作压缩包">Lv.1：TMA最新作压缩包</option><option value="LOLI的钱包">Lv.2：LOLI的钱包</option>' +
            '<option value="棒棒糖">Lv.2：棒棒糖</option><option value="蕾米莉亚同人漫画">Lv.3：蕾米莉亚同人漫画</option>' +
            '<option value="十六夜同人漫画">Lv.3：十六夜同人漫画</option><option value="档案室钥匙">Lv.4：档案室钥匙</option>' +
            '<option value="傲娇LOLI娇蛮音CD">Lv.4：傲娇LOLI娇蛮音CD</option><option value="整形优惠卷">Lv.5：整形优惠卷</option>' +
            '<option value="消逝之药">Lv.5：消逝之药</option></select></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend><label><input id="pd_cfg_auto_draw_smbox_enabled" type="checkbox" />自动抽取神秘盒子 ' +
            '<span class="pd_cfg_tips" title="注意：抽取神秘盒子将延长争夺奖励的领取时间">[?]</span></label></legend>' +
            '      <label>偏好的神秘盒子数字<input placeholder="例: 52,1,28,400" id="pd_cfg_favor_smbox_numbers" style="width:180px" type="text" />' +
            '<span class="pd_cfg_tips" title="例：52,1,28,400（以英文逗号分隔，按优先级排序），如设定的数字都不可用，则从剩余的盒子中随机抽选一个，如无需求可留空">[?]</span></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend>首页相关</legend>' +
            '      <label>@提醒<select id="pd_cfg_at_tips_handle_type" style="width:130px"><option value="no_highlight">取消已读提醒高亮</option>' +
            '<option value="no_highlight_extra">取消已读提醒高亮，并在无提醒时补上消息框</option><option value="hide_box_1">不显示已读提醒的消息框</option>' +
            '<option value="hide_box_2">永不显示消息框</option><option value="default">保持默认</option>' +
            '<option value="at_change_to_cao">将@改为艹(其他和方式2相同)</option></select>' +
            '<span class="pd_cfg_tips" title="对首页上的有人@你的消息框进行处理的方案">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_sm_level_up_alert_enabled" type="checkbox" />神秘等级升级提醒 ' +
            '<span class="pd_cfg_tips" title="在神秘等级升级后进行提醒，只在首页生效">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_fixed_deposit_due_alert_enabled" type="checkbox" />定期存款到期提醒 ' +
            '<span class="pd_cfg_tips" title="在定时存款到期时进行提醒，只在首页生效">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_sm_rank_change_alert_enabled" type="checkbox" />系数排名变化提醒 ' +
            '<span class="pd_cfg_tips" title="在神秘系数排名发生变化时进行提醒，只在首页生效">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_home_page_thread_fast_goto_link_enabled" type="checkbox" />在首页帖子旁显示跳转链接 ' +
            '<span class="pd_cfg_tips" title="在首页帖子链接旁显示快速跳转至页末的链接">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_show_vip_surplus_time_enabled" type="checkbox" />显示VIP剩余时间 ' +
            '<span class="pd_cfg_tips" title="在首页显示VIP剩余时间">[?]</span></label>' +
            '    </fieldset>' +
            '  </div>' +
            '  <div class="pd_cfg_panel">' +
            '    <fieldset>' +
            '      <legend>帖子列表页面相关</legend>' +
            '      <label><input id="pd_cfg_show_fast_goto_thread_page_enabled" type="checkbox" data-disabled="#pd_cfg_max_fast_goto_thread_page_num" />' +
            '显示帖子页数快捷链接 <span class="pd_cfg_tips" title="在帖子列表页面中显示帖子页数快捷链接">[?]</span></label>' +
            '      <label style="margin-left:10px">页数链接最大数量<input id="pd_cfg_max_fast_goto_thread_page_num" style="width:25px" maxlength="4" type="text" />' +
            '<span class="pd_cfg_tips" title="在帖子页数快捷链接中显示页数链接的最大数量">[?]</span></label><br />' +
            '      <label>帖子每页楼层数量<select id="pd_cfg_per_page_floor_num"><option value="10">10</option>' +
            '<option value="20">20</option><option value="30">30</option></select>' +
            '<span class="pd_cfg_tips" title="用于电梯直达和帖子页数快捷链接功能，如果修改了KF设置里的“文章列表每页个数”，请在此修改成相同的数目">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_highlight_new_post_enabled" type="checkbox" />高亮今日的新帖 ' +
            '<span class="pd_cfg_tips" title="在帖子列表中高亮今日新发表帖子的发表时间">[?]</span></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend>帖子页面相关</legend>' +
            '      <label><input id="pd_cfg_adjust_thread_content_width_enabled" type="checkbox" />调整帖子内容宽度 ' +
            '<span class="pd_cfg_tips" title="调整帖子内容宽度，使其保持一致">[?]</span></label>' +
            '      <label style="margin-left:10px">帖子内容字体大小<input id="pd_cfg_thread_content_font_size" maxlength="2" style="width:20px" type="text" />px ' +
            '<span class="pd_cfg_tips" title="帖子内容字体大小，留空表示使用默认大小，推荐值：14">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_auto_change_sm_color_enabled_2" type="checkbox" data-disabled="#pd_cfg_auto_change_sm_color_page" />自动更换神秘颜色 ' +
            '<span class="pd_cfg_tips" title="可自动更换神秘颜色，请点击详细设置前往相应页面进行自定义设置">[?]</span></label>' +
            '<a id="pd_cfg_auto_change_sm_color_page" style="margin-left:10px" target="_blank" href="kf_growup.php">详细设置&raquo;</a><br />' +
            '      <label>自定义本人的神秘颜色<input id="pd_cfg_custom_my_sm_color" maxlength="7" style="width:50px" type="text" />' +
            '<input style="margin-left:0" type="color" id="pd_cfg_custom_my_sm_color_select">' +
            '<span class="pd_cfg_tips" title="自定义本人的神秘颜色（包括帖子页面的ID显示颜色和楼层边框颜色，仅自己可见），例：#009CFF，如无需求可留空">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_custom_sm_color_enabled" type="checkbox" data-disabled="#pd_cfg_custom_sm_color_dialog" />自定义各等级神秘颜色 ' +
            '<span class="pd_cfg_tips" title="自定义各等级神秘颜色（包括帖子页面的ID显示颜色和楼层边框颜色，仅自己可见），请点击详细设置自定义各等级颜色">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_custom_sm_color_dialog" href="#">详细设置&raquo;</a><br />' +
            '      <label><input id="pd_cfg_modify_kf_other_domain_enabled" type="checkbox" />将绯月其它域名的链接修改为当前域名 ' +
            '<span class="pd_cfg_tips" title="将帖子和短消息中的绯月其它域名的链接修改为当前域名">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_multi_quote_enabled" type="checkbox" />开启多重引用功能 ' +
            '<span class="pd_cfg_tips" title="在帖子页面开启多重回复和多重引用功能">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_batch_buy_thread_enabled" type="checkbox" />开启批量购买帖子功能 ' +
            '<span class="pd_cfg_tips" title="在帖子页面开启批量购买帖子的功能">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_user_memo_enabled" type="checkbox" data-disabled="#pd_cfg_user_memo_dialog" />显示用户备注 ' +
            '<span class="pd_cfg_tips" title="显示用户的自定义备注，请点击详细设置自定义用户备注">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_user_memo_dialog" href="#">详细设置&raquo;</a>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_parse_media_tag_enabled" type="checkbox" />解析多媒体标签 ' +
            '<span class="pd_cfg_tips" title="在帖子页面解析HTML5多媒体标签，详见【常见问题15】">[?]</span></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend>其它设置</legend>' +
            '      <label>默认提示消息的持续时间<input id="pd_cfg_def_show_msg_duration" maxlength="5" style="width:30px" type="text" />秒 ' +
            '<span class="pd_cfg_tips" title="设置为-1表示永久显示，例：15">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_animation_effect_off_enabled" type="checkbox" />禁用动画效果 ' +
            '<span class="pd_cfg_tips" title="禁用jQuery的动画效果（推荐在配置较差的机器上使用）">[?]</span></label><br />' +
            '      <label>日志保存天数<input id="pd_cfg_log_save_days" maxlength="3" style="width:25px" type="text" />' +
            '<span class="pd_cfg_tips" title="默认值：{0}">[?]</span></label>'.replace('{0}', ConfigMethod.defConfig.logSaveDays) +
            '      <label style="margin-left:10px"><input id="pd_cfg_show_log_link_in_page_enabled" type="checkbox" />在页面上方显示日志链接 ' +
            '<span class="pd_cfg_tips" title="在论坛页面上方显示助手日志的链接">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_add_side_bar_fast_nav_enabled" type="checkbox" />为侧边栏添加快捷导航 ' +
            '<span class="pd_cfg_tips" title="为侧边栏添加快捷导航的链接">[?]</span></label>' +
            '      <label style="margin-left:10px"><input id="pd_cfg_modify_side_bar_enabled" type="checkbox" />将侧边栏修改为平铺样式 ' +
            '<span class="pd_cfg_tips" title="将侧边栏修改为和手机相同的平铺样式">[?]</span></label><br />' +
            '      <label><input id="pd_cfg_custom_css_enabled" type="checkbox" data-disabled="#pd_cfg_custom_css_dialog" />添加自定义CSS ' +
            '<span class="pd_cfg_tips" title="为页面添加自定义的CSS内容，请点击详细设置填入自定义的CSS内容">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_custom_css_dialog" href="#">详细设置&raquo;</a><br />' +
            '      <label><input id="pd_cfg_custom_script_enabled" type="checkbox" data-disabled="#pd_cfg_custom_script_dialog" />执行自定义脚本 ' +
            '<span class="pd_cfg_tips" title="执行自定义的javascript脚本，请点击详细设置填入自定义的脚本内容">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_custom_script_dialog" href="#">详细设置&raquo;</a><br />' +
            '      <label>浏览器类型<select id="pd_cfg_browse_type"><option value="auto">自动检测</option>' +
            '<option value="desktop">桌面版</option><option value="mobile">移动版</option></select>' +
            '<span class="pd_cfg_tips" title="用于在KFOL助手上判断浏览器的类型，一般使用自动检测即可；如果当前浏览器与自动检测的类型不相符（移动版会在设置界面标题上显示“For Mobile”的字样），' +
            '请手动设置为正确的类型">[?]</span></label>' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend>关注和屏蔽</legend>' +
            '      <label><input id="pd_cfg_follow_user_enabled" type="checkbox" data-disabled="#pd_cfg_follow_user_dialog" />关注用户 ' +
            '<span class="pd_cfg_tips" title="开启关注用户的功能，所关注的用户将被加注记号，请点击详细设置管理关注用户">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_follow_user_dialog" href="#">详细设置&raquo;</a><br />' +
            '      <label><input id="pd_cfg_block_user_enabled" type="checkbox" data-disabled="#pd_cfg_block_user_dialog" />屏蔽用户 ' +
            '<span class="pd_cfg_tips" title="开启屏蔽用户的功能，你将看不见所屏蔽用户的发言，请点击详细设置管理屏蔽用户">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_block_user_dialog" href="#">详细设置&raquo;</a><br />' +
            '      <label><input id="pd_cfg_block_thread_enabled" type="checkbox" data-disabled="#pd_cfg_block_thread_dialog" />屏蔽帖子 ' +
            '<span class="pd_cfg_tips" title="开启屏蔽标题包含指定关键字的帖子的功能，请点击详细设置管理屏蔽关键字">[?]</span></label>' +
            '<a style="margin-left:10px" id="pd_cfg_block_thread_dialog" href="#">详细设置&raquo;</a><br />' +
            '    </fieldset>' +
            '    <fieldset>' +
            '      <legend><label><input id="pd_cfg_auto_save_current_deposit_enabled" type="checkbox" />自动活期存款 ' +
            '<span class="pd_cfg_tips" title="在当前收入满足指定额度之后自动将指定数额存入活期存款中，只会在首页触发">[?]</span></label></legend>' +
            '      <label>在当前收入已满<input id="pd_cfg_save_current_deposit_after_kfb" maxlength="10" style="width:45px" type="text" />KFB之后 ' +
            '<span class="pd_cfg_tips" title="在当前收入已满指定KFB额度之后自动进行活期存款，例：1000">[?]</span></label><br />' +
            '      <label>将<input id="pd_cfg_save_current_deposit_kfb" maxlength="10" style="width:45px" type="text" />KFB存入活期存款 ' +
            '<span class="pd_cfg_tips" title="将指定额度的KFB存入活期存款中，例：900；举例：设定已满1000存900，当前收入为2000，则自动存入金额为1800">[?]</span></label>' +
            '    </fieldset>' +
            '  </div>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about">' +
            '    <a target="_blank" href="https://greasyfork.org/zh-CN/scripts/8615">By 喵拉布丁</a>' +
            '    <i style="color:#666;font-style:normal">(V{0})</i>'.replace('{0}', version) +
            '    <a target="_blank" href="https://git.oschina.net/miaolapd/KF_Online_Assistant/wikis/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98">[常见问题]</a>' +
            '    <a target="_blank" href="read.php?tid=508450">[讨论帖]</a>' +
            '  </span>' +
            '  <button>确定</button><button>取消</button><button>默认值</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_config', 'KF Online助手设置' + (KFOL.isMobile ? ' (For Mobile)' : ''), html);

        $dialog.find('.pd_cfg_btns > button:eq(1)').click(function () {
            return Dialog.close('pd_config');
        }).end().find('.pd_cfg_btns > button:eq(2)').click(function (e) {
            e.preventDefault();
            if (window.confirm('是否重置所有设置？')) {
                ConfigMethod.clear();
                alert('设置已重置');
                location.reload();
            }
        }).end().find('.pd_cfg_nav > a:first-child').click(function (e) {
            e.preventDefault();
            var type = window.prompt('可清除与助手有关的Cookies和本地存储数据（不包括助手设置和日志）\n请填写清除类型，0：全部清除；1：清除Cookies；2：清除本地缓存', 0);
            if (type === null) return;
            type = parseInt($.trim(type));
            if (!isNaN(type) && type >= 0) {
                ConfigDialog.clearCache(type);
                alert('缓存已清除');
            }
        }).next('a').click(function (e) {
            e.preventDefault();
            ConfigDialog.showRunCommandDialog();
        }).next('a').click(function (e) {
            e.preventDefault();
            Log.show();
        }).next('a').click(function (e) {
            e.preventDefault();
            ConfigDialog.showImportOrExportSettingDialog();
        });

        $dialog.on('click', 'a[id^="pd_cfg_"][href="#"]', function (e) {
            e.preventDefault();
            if ($(this).hasClass('pd_disabled_link')) return;
            if (this.id === 'pd_cfg_custom_monster_name_dialog') ConfigDialog.showCustomMonsterNameDialog();
            else if (this.id === 'pd_cfg_custom_sm_color_dialog') ConfigDialog.showCustomSmColorDialog();
            else if (this.id === 'pd_cfg_user_memo_dialog') ConfigDialog.showUserMemoDialog();
            else if (this.id === 'pd_cfg_custom_css_dialog') ConfigDialog.showCustomCssDialog();
            else if (this.id === 'pd_cfg_custom_script_dialog') ConfigDialog.showCustomScriptDialog();
            else if (this.id === 'pd_cfg_follow_user_dialog') ConfigDialog.showFollowUserDialog();
            else if (this.id === 'pd_cfg_block_user_dialog') ConfigDialog.showBlockUserDialog();
            else if (this.id === 'pd_cfg_block_thread_dialog') ConfigDialog.showBlockThreadDialog();
        }).end().find('#pd_cfg_custom_my_sm_color_select').change(function () {
            $('#pd_cfg_custom_my_sm_color').val($(this).val().toString().toUpperCase());
        }).end().find('pd_cfg_custom_my_sm_color').keyup(function () {
            var customMySmColor = $.trim($(this).val());
            if (/^#[0-9a-fA-F]{6}$/.test(customMySmColor)) {
                $('pd_cfg_custom_my_sm_color_select').val(customMySmColor.toUpperCase());
            }
        }).end().find('#pd_cfg_auto_use_item_names').keydown(function (e) {
            if (e.ctrlKey && (e.keyCode === 65 || e.keyCode === 97)) {
                e.preventDefault();
                $(this).children().each(function () {
                    $(this).prop('selected', true);
                });
            }
        });

        ConfigDialog.setValue();
        $dialog.submit(function (e) {
            e.preventDefault();
            $('.pd_cfg_btns > button:first').click();
        }).end().find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            if (!ConfigDialog.verify()) return;
            var oriAutoRefreshEnabled = Config.autoRefreshEnabled;
            ConfigMethod.read();
            var options = ConfigDialog.getValue();
            options = ConfigMethod.normalize(options);
            $.extend(Config, options);
            ConfigMethod.write();
            Dialog.close('pd_config');
            if (oriAutoRefreshEnabled !== options.autoRefreshEnabled) {
                if (window.confirm('你已修改了定时模式的设置，需要刷新页面才能生效，是否立即刷新？')) {
                    location.reload();
                }
            }
        });

        Dialog.show('pd_config');
        $dialog.find('a:first').focus();
    },

    /**
     * 设置对话框中的字段值
     */
    setValue: function () {
        $('#pd_cfg_auto_refresh_enabled').prop('checked', Config.autoRefreshEnabled);
        $('#pd_cfg_show_refresh_mode_tips_type').val(Config.showRefreshModeTipsType.toLowerCase());

        $('#pd_cfg_auto_donation_enabled').prop('checked', Config.autoDonationEnabled);
        $('#pd_cfg_donation_kfb').val(Config.donationKfb);
        $('#pd_cfg_donation_after_time').val(Config.donationAfterTime);

        $('#pd_cfg_auto_loot_enabled').prop('checked', Config.autoLootEnabled);
        $('#pd_cfg_no_auto_loot_when').val(Config.noAutoLootWhen.join(','));
        $('#pd_cfg_defer_loot_time_when_remain_attack_num_enabled').prop('checked', Config.deferLootTimeWhenRemainAttackNumEnabled);
        $('#pd_cfg_defer_loot_time_when_remain_attack_num').val(Config.deferLootTimeWhenRemainAttackNum);
        $('#pd_cfg_custom_monster_name_enabled').prop('checked', Config.customMonsterNameEnabled);
        $('#pd_cfg_auto_attack_enabled').prop('checked', Config.autoAttackEnabled);
        if (Config.attackAfterTime > 0) $('#pd_cfg_attack_after_time').val(Config.attackAfterTime);
        $('#pd_cfg_attempt_attack_enabled').prop('checked', Config.attemptAttackEnabled);
        $.each(Config.batchAttackList, function (id, num) {
            $('#pd_cfg_batch_attack_list input[data-id="{0}"]'.replace('{0}', id)).val(num);
        });
        $('#pd_cfg_deadly_attack_id').val(Config.deadlyAttackId);
        $('#pd_cfg_auto_use_item_enabled').prop('checked', Config.autoUseItemEnabled);
        $('#pd_cfg_auto_use_item_names').val(Config.autoUseItemNames);

        $('#pd_cfg_auto_draw_smbox_enabled').prop('checked', Config.autoDrawSmbox2Enabled);
        $('#pd_cfg_favor_smbox_numbers').val(Config.favorSmboxNumbers.join(','));

        $('#pd_cfg_at_tips_handle_type').val(Config.atTipsHandleType.toLowerCase());
        $('#pd_cfg_sm_level_up_alert_enabled').prop('checked', Config.smLevelUpAlertEnabled);
        $('#pd_cfg_fixed_deposit_due_alert_enabled').prop('checked', Config.fixedDepositDueAlertEnabled);
        $('#pd_cfg_sm_rank_change_alert_enabled').prop('checked', Config.smRankChangeAlertEnabled);
        $('#pd_cfg_home_page_thread_fast_goto_link_enabled').prop('checked', Config.homePageThreadFastGotoLinkEnabled);
        $('#pd_cfg_show_vip_surplus_time_enabled').prop('checked', Config.showVipSurplusTimeEnabled);

        $('#pd_cfg_show_fast_goto_thread_page_enabled').prop('checked', Config.showFastGotoThreadPageEnabled);
        $('#pd_cfg_max_fast_goto_thread_page_num').val(Config.maxFastGotoThreadPageNum);
        $('#pd_cfg_per_page_floor_num').val(Config.perPageFloorNum);
        $('#pd_cfg_highlight_new_post_enabled').prop('checked', Config.highlightNewPostEnabled);

        $('#pd_cfg_adjust_thread_content_width_enabled').prop('checked', Config.adjustThreadContentWidthEnabled);
        $('#pd_cfg_thread_content_font_size').val(Config.threadContentFontSize > 0 ? Config.threadContentFontSize : '');
        $('#pd_cfg_auto_change_sm_color_enabled_2').prop('checked', Config.autoChangeSMColorEnabled);
        $('#pd_cfg_custom_my_sm_color').val(Config.customMySmColor);
        if (Config.customMySmColor) $('#pd_cfg_custom_my_sm_color_select').val(Config.customMySmColor);
        $('#pd_cfg_custom_sm_color_enabled').prop('checked', Config.customSmColorEnabled);
        $('#pd_cfg_modify_kf_other_domain_enabled').prop('checked', Config.modifyKFOtherDomainEnabled);
        $('#pd_cfg_multi_quote_enabled').prop('checked', Config.multiQuoteEnabled);
        $('#pd_cfg_batch_buy_thread_enabled').prop('checked', Config.batchBuyThreadEnabled);
        $('#pd_cfg_user_memo_enabled').prop('checked', Config.userMemoEnabled);
        $('#pd_cfg_parse_media_tag_enabled').prop('checked', Config.parseMediaTagEnabled);

        $('#pd_cfg_def_show_msg_duration').val(Config.defShowMsgDuration);
        $('#pd_cfg_animation_effect_off_enabled').prop('checked', Config.animationEffectOffEnabled);
        $('#pd_cfg_log_save_days').val(Config.logSaveDays);
        $('#pd_cfg_show_log_link_in_page_enabled').prop('checked', Config.showLogLinkInPageEnabled);
        $('#pd_cfg_add_side_bar_fast_nav_enabled').prop('checked', Config.addSideBarFastNavEnabled);
        $('#pd_cfg_modify_side_bar_enabled').prop('checked', Config.modifySideBarEnabled);
        $('#pd_cfg_custom_css_enabled').prop('checked', Config.customCssEnabled);
        $('#pd_cfg_custom_script_enabled').prop('checked', Config.customScriptEnabled);
        $('#pd_cfg_browse_type').val(Config.browseType);

        $('#pd_cfg_follow_user_enabled').prop('checked', Config.followUserEnabled);
        $('#pd_cfg_block_user_enabled').prop('checked', Config.blockUserEnabled);
        $('#pd_cfg_block_thread_enabled').prop('checked', Config.blockThreadEnabled);

        $('#pd_cfg_auto_save_current_deposit_enabled').prop('checked', Config.autoSaveCurrentDepositEnabled);
        if (Config.saveCurrentDepositAfterKfb > 0) $('#pd_cfg_save_current_deposit_after_kfb').val(Config.saveCurrentDepositAfterKfb);
        if (Config.saveCurrentDepositKfb > 0) $('#pd_cfg_save_current_deposit_kfb').val(Config.saveCurrentDepositKfb);
    },

    /**
     * 获取对话框中字段值的Config对象
     * @returns {Config} 字段值的Config对象
     */
    getValue: function () {
        var options = {};
        options.autoRefreshEnabled = $('#pd_cfg_auto_refresh_enabled').prop('checked');
        options.showRefreshModeTipsType = $('#pd_cfg_show_refresh_mode_tips_type').val();

        options.autoDonationEnabled = $('#pd_cfg_auto_donation_enabled').prop('checked');
        options.donationKfb = $.trim($('#pd_cfg_donation_kfb').val());
        options.donationKfb = $.isNumeric(options.donationKfb) ? parseInt(options.donationKfb) : options.donationKfb;
        options.donationAfterTime = $('#pd_cfg_donation_after_time').val();

        options.autoLootEnabled = $('#pd_cfg_auto_loot_enabled').prop('checked');
        options.noAutoLootWhen = $.trim($('#pd_cfg_no_auto_loot_when').val()).split(',');
        options.deferLootTimeWhenRemainAttackNumEnabled = $('#pd_cfg_defer_loot_time_when_remain_attack_num_enabled').prop('checked');
        options.deferLootTimeWhenRemainAttackNum = parseInt($.trim($('#pd_cfg_defer_loot_time_when_remain_attack_num').val()));
        options.customMonsterNameEnabled = $('#pd_cfg_custom_monster_name_enabled').prop('checked');
        options.autoAttackEnabled = $('#pd_cfg_auto_attack_enabled').prop('checked');
        options.attackAfterTime = parseInt($.trim($('#pd_cfg_attack_after_time').val()));
        options.attemptAttackEnabled = $('#pd_cfg_attempt_attack_enabled').prop('checked');
        options.batchAttackList = {};
        $('#pd_cfg_batch_attack_list input').each(function () {
            var $this = $(this);
            var attackNum = $.trim($this.val());
            if (!attackNum) return;
            attackNum = parseInt(attackNum);
            if (attackNum <= 0) return;
            var id = parseInt($this.data('id'));
            if (!id) return;
            options.batchAttackList[id] = attackNum;
        });
        options.deadlyAttackId = parseInt($('#pd_cfg_deadly_attack_id').val());
        options.autoUseItemEnabled = $('#pd_cfg_auto_use_item_enabled').prop('checked');
        options.autoUseItemNames = $('#pd_cfg_auto_use_item_names').val();

        options.autoDrawSmbox2Enabled = $('#pd_cfg_auto_draw_smbox_enabled').prop('checked');
        options.favorSmboxNumbers = $.trim($('#pd_cfg_favor_smbox_numbers').val()).split(',');

        options.atTipsHandleType = $('#pd_cfg_at_tips_handle_type').val();
        options.smLevelUpAlertEnabled = $('#pd_cfg_sm_level_up_alert_enabled').prop('checked');
        options.fixedDepositDueAlertEnabled = $('#pd_cfg_fixed_deposit_due_alert_enabled').prop('checked');
        options.smRankChangeAlertEnabled = $('#pd_cfg_sm_rank_change_alert_enabled').prop('checked');
        options.homePageThreadFastGotoLinkEnabled = $('#pd_cfg_home_page_thread_fast_goto_link_enabled').prop('checked');
        options.showVipSurplusTimeEnabled = $('#pd_cfg_show_vip_surplus_time_enabled').prop('checked');

        options.showFastGotoThreadPageEnabled = $('#pd_cfg_show_fast_goto_thread_page_enabled').prop('checked');
        options.maxFastGotoThreadPageNum = parseInt($.trim($('#pd_cfg_max_fast_goto_thread_page_num').val()));
        options.perPageFloorNum = $('#pd_cfg_per_page_floor_num').val();
        options.highlightNewPostEnabled = $('#pd_cfg_highlight_new_post_enabled').prop('checked');

        options.adjustThreadContentWidthEnabled = $('#pd_cfg_adjust_thread_content_width_enabled').prop('checked');
        options.threadContentFontSize = parseInt($.trim($('#pd_cfg_thread_content_font_size').val()));
        options.autoChangeSMColorEnabled = $('#pd_cfg_auto_change_sm_color_enabled_2').prop('checked');
        options.customMySmColor = $.trim($('#pd_cfg_custom_my_sm_color').val()).toUpperCase();
        options.customSmColorEnabled = $('#pd_cfg_custom_sm_color_enabled').prop('checked');
        options.modifyKFOtherDomainEnabled = $('#pd_cfg_modify_kf_other_domain_enabled').prop('checked');
        options.multiQuoteEnabled = $('#pd_cfg_multi_quote_enabled').prop('checked');
        options.batchBuyThreadEnabled = $('#pd_cfg_batch_buy_thread_enabled').prop('checked');
        options.userMemoEnabled = $('#pd_cfg_user_memo_enabled').prop('checked');
        options.parseMediaTagEnabled = $('#pd_cfg_parse_media_tag_enabled').prop('checked');

        options.defShowMsgDuration = parseInt($.trim($('#pd_cfg_def_show_msg_duration').val()));
        options.animationEffectOffEnabled = $('#pd_cfg_animation_effect_off_enabled').prop('checked');
        options.logSaveDays = parseInt($.trim($('#pd_cfg_log_save_days').val()));
        options.showLogLinkInPageEnabled = $('#pd_cfg_show_log_link_in_page_enabled').prop('checked');
        options.addSideBarFastNavEnabled = $('#pd_cfg_add_side_bar_fast_nav_enabled').prop('checked');
        options.modifySideBarEnabled = $('#pd_cfg_modify_side_bar_enabled').prop('checked');
        options.customCssEnabled = $('#pd_cfg_custom_css_enabled').prop('checked');
        options.customScriptEnabled = $('#pd_cfg_custom_script_enabled').prop('checked');
        options.browseType = $('#pd_cfg_browse_type').val();

        options.followUserEnabled = $('#pd_cfg_follow_user_enabled').prop('checked');
        options.blockUserEnabled = $('#pd_cfg_block_user_enabled').prop('checked');
        options.blockThreadEnabled = $('#pd_cfg_block_thread_enabled').prop('checked');

        options.autoSaveCurrentDepositEnabled = $('#pd_cfg_auto_save_current_deposit_enabled').prop('checked');
        options.saveCurrentDepositAfterKfb = parseInt($.trim($('#pd_cfg_save_current_deposit_after_kfb').val()));
        options.saveCurrentDepositKfb = parseInt($.trim($('#pd_cfg_save_current_deposit_kfb').val()));
        return options;
    },

    /**
     * 验证设置是否正确
     * @returns {boolean} 是否验证通过
     */
    verify: function () {
        var $txtDonationKfb = $('#pd_cfg_donation_kfb');
        var donationKfb = $.trim($txtDonationKfb.val());
        if (/%$/.test(donationKfb)) {
            if (!/^1?\d?\d%$/.test(donationKfb)) {
                alert('KFB捐款额度格式不正确');
                $txtDonationKfb.select();
                $txtDonationKfb.focus();
                return false;
            }
            if (parseInt(donationKfb) <= 0 || parseInt(donationKfb) > 100) {
                alert('KFB捐款额度百分比的取值范围在1-100之间');
                $txtDonationKfb.select();
                $txtDonationKfb.focus();
                return false;
            }
        }
        else {
            if (!$.isNumeric(donationKfb)) {
                alert('KFB捐款额度格式不正确');
                $txtDonationKfb.select();
                $txtDonationKfb.focus();
                return false;
            }
            if (parseInt(donationKfb) <= 0 || parseInt(donationKfb) > Const.maxDonationKfb) {
                alert('KFB捐款额度的取值范围在1-{0}之间'.replace('{0}', Const.maxDonationKfb));
                $txtDonationKfb.select();
                $txtDonationKfb.focus();
                return false;
            }
        }

        var $txtDonationAfterTime = $('#pd_cfg_donation_after_time');
        var donationAfterTime = $.trim($txtDonationAfterTime.val());
        if (!/^(2[0-3]|[0-1][0-9]):[0-5][0-9]:[0-5][0-9]$/.test(donationAfterTime)) {
            alert('在指定时间之后捐款格式不正确');
            $txtDonationAfterTime.select();
            $txtDonationAfterTime.focus();
            return false;
        }

        var $txtNoAutoLootWhen = $('#pd_cfg_no_auto_loot_when');
        var noAutoLootWhen = $.trim($txtNoAutoLootWhen.val());
        if (noAutoLootWhen) {
            if (!/^((2[0-3]|[0-1][0-9]):[0-5][0-9]-(2[0-3]|[0-1][0-9]):[0-5][0-9],?){1,2}$/.test(noAutoLootWhen)) {
                alert('在指定时间段内不自动领取争夺奖励格式不正确');
                $txtNoAutoLootWhen.select();
                $txtNoAutoLootWhen.focus();
                return false;
            }
        }

        var $txtDeferLootTimeWhenRemainAttackNum = $('#pd_cfg_defer_loot_time_when_remain_attack_num');
        var deferLootTimeWhenRemainAttackNum = parseInt($.trim($txtDeferLootTimeWhenRemainAttackNum.val()));
        if (isNaN(deferLootTimeWhenRemainAttackNum)) {
            alert('剩余攻击次数上限格式不正确');
            $txtDeferLootTimeWhenRemainAttackNum.select();
            $txtDeferLootTimeWhenRemainAttackNum.focus();
            return false;
        }
        else if (deferLootTimeWhenRemainAttackNum < 1 || deferLootTimeWhenRemainAttackNum > Const.maxAttackNum) {
            alert('剩余攻击次数上限范围在1-{0}之间'.replace('{0}', Const.maxAttackNum));
            $txtDeferLootTimeWhenRemainAttackNum.select();
            $txtDeferLootTimeWhenRemainAttackNum.focus();
            return false;
        }

        var $txtAttackAfterTime = $('#pd_cfg_attack_after_time');
        var attackAfterTime = $.trim($txtAttackAfterTime.val());
        if (attackAfterTime) {
            attackAfterTime = parseInt(attackAfterTime);
            if (isNaN(attackAfterTime) || attackAfterTime > Const.defLootInterval || attackAfterTime < Const.minAttackAfterTime) {
                alert('在指定时间之内才完成攻击的取值范围为：{0}-{1}'.replace('{0}', Const.defLootInterval).replace('{1}', Const.minAttackAfterTime));
                $txtAttackAfterTime.select();
                $txtAttackAfterTime.focus();
                return false;
            }
        }
        else {
            if ($('#pd_cfg_attempt_attack_enabled').prop('checked')) {
                alert('开启“试探攻击”必须同时设置“在指定时间之内才完成攻击”');
                $txtAttackAfterTime.select();
                $txtAttackAfterTime.focus();
                return false;
            }
        }

        var totalAttackNum = 0;
        var isAttackVerification = true;
        $('#pd_cfg_batch_attack_list input').each(function () {
            var $this = $(this);
            var attackNum = $.trim($this.val());
            if (!attackNum) return;
            attackNum = parseInt(attackNum);
            if (isNaN(attackNum) || attackNum < 0) {
                isAttackVerification = false;
                alert('攻击次数格式不正确');
                $this.select();
                $this.focus();
                return false;
            }
            totalAttackNum += attackNum;
        });
        if (!isAttackVerification) return false;
        if (totalAttackNum > Const.maxAttackNum) {
            alert('攻击次数不得超过{0}次'.replace('{0}', Const.maxAttackNum));
            return false;
        }
        if ($('#pd_cfg_auto_attack_enabled').prop('checked') && !totalAttackNum) {
            alert('请填写自动攻击的目标次数');
            return false;
        }

        if ($('#pd_cfg_auto_draw_smbox_enabled').prop('checked') && $('#pd_cfg_auto_loot_enabled').prop('checked')) {
            alert('请不要将自动争夺与自动抽取神秘盒子一起使用');
            return false;
        }

        var $txtFavorSmboxNumbers = $('#pd_cfg_favor_smbox_numbers');
        var favorSmboxNumbers = $.trim($txtFavorSmboxNumbers.val());
        if (favorSmboxNumbers) {
            if (!/^\d+(,\d+)*$/.test(favorSmboxNumbers)) {
                alert('偏好的神秘盒子数字格式不正确');
                $txtFavorSmboxNumbers.select();
                $txtFavorSmboxNumbers.focus();
                return false;
            }
            if (/(\b\d{4,}\b|\b0+\b|\b[05-9]\d{2}\b|\b4\d[1-9]\b)/.test(favorSmboxNumbers)) {
                alert('每个神秘盒子数字的取值范围在1-400之间');
                $txtFavorSmboxNumbers.select();
                $txtFavorSmboxNumbers.focus();
                return false;
            }
        }

        var $txtMaxFastGotoThreadPageNum = $('#pd_cfg_max_fast_goto_thread_page_num');
        var maxFastGotoThreadPageNum = $.trim($txtMaxFastGotoThreadPageNum.val());
        if (!$.isNumeric(maxFastGotoThreadPageNum) || parseInt(maxFastGotoThreadPageNum) <= 0) {
            alert('页数链接最大数量格式不正确');
            $txtMaxFastGotoThreadPageNum.select();
            $txtMaxFastGotoThreadPageNum.focus();
            return false;
        }

        var $txtThreadContentFontSize = $('#pd_cfg_thread_content_font_size');
        var threadContentFontSize = $.trim($txtThreadContentFontSize.val());
        if (threadContentFontSize && (isNaN(parseInt(threadContentFontSize)) || parseInt(threadContentFontSize) < 0)) {
            alert('帖子内容字体大小格式不正确');
            $txtThreadContentFontSize.select();
            $txtThreadContentFontSize.focus();
            return false;
        }

        var $txtCustomMySmColor = $('#pd_cfg_custom_my_sm_color');
        var customMySmColor = $.trim($txtCustomMySmColor.val());
        if (customMySmColor && !/^#[0-9a-fA-F]{6}$/.test(customMySmColor)) {
            alert('自定义本人的神秘颜色格式不正确，例：#009CFF');
            $txtCustomMySmColor.select();
            $txtCustomMySmColor.focus();
            return false;
        }

        var $txtDefShowMsgDuration = $('#pd_cfg_def_show_msg_duration');
        var defShowMsgDuration = $.trim($txtDefShowMsgDuration.val());
        if (!$.isNumeric(defShowMsgDuration) || parseInt(defShowMsgDuration) < -1) {
            alert('默认提示消息的持续时间格式不正确');
            $txtDefShowMsgDuration.select();
            $txtDefShowMsgDuration.focus();
            return false;
        }

        var $txtLogSaveDays = $('#pd_cfg_log_save_days');
        var logSaveDays = $.trim($txtLogSaveDays.val());
        if (!$.isNumeric(logSaveDays) || parseInt(logSaveDays) < 1) {
            alert('日志保存天数格式不正确');
            $txtLogSaveDays.select();
            $txtLogSaveDays.focus();
            return false;
        }

        var $txtSaveCurrentDepositAfterKfb = $('#pd_cfg_save_current_deposit_after_kfb');
        var $txtSaveCurrentDepositKfb = $('#pd_cfg_save_current_deposit_kfb');
        var saveCurrentDepositAfterKfb = parseInt($.trim($txtSaveCurrentDepositAfterKfb.val()));
        var saveCurrentDepositKfb = parseInt($.trim($txtSaveCurrentDepositKfb.val()));
        if (saveCurrentDepositAfterKfb || saveCurrentDepositKfb) {
            if (!saveCurrentDepositAfterKfb || saveCurrentDepositAfterKfb <= 0) {
                alert('自动活期存款满足额度格式不正确');
                $txtSaveCurrentDepositAfterKfb.select();
                $txtSaveCurrentDepositAfterKfb.focus();
                return false;
            }
            if (!saveCurrentDepositKfb || saveCurrentDepositKfb <= 0 || saveCurrentDepositKfb > saveCurrentDepositAfterKfb) {
                alert('想要存款的金额格式不正确');
                $txtSaveCurrentDepositKfb.select();
                $txtSaveCurrentDepositKfb.focus();
                return false;
            }
        }

        return true;
    },

    /**
     * 清除缓存
     * @param {number} type 清除类别，0：全部清除；1：清除Cookies；2：清除本地缓存
     */
    clearCache: function (type) {
        if (type === 0 || type === 1) {
            for (var key in Const) {
                if (/CookieName$/.test(key)) {
                    Tools.setCookie(Const[key], '', Tools.getDate('-1d'));
                }
            }
        }
        if (type === 0 || type === 2) {
            TmpLog.clear();
            localStorage.removeItem(Const.multiQuoteStorageName);
        }
    },

    /**
     * 显示运行命令对话框
     */
    showRunCommandDialog: function () {
        if ($('#pd_run_command').length > 0) return;
        Dialog.close('pd_config');
        var html =
            '<div class="pd_cfg_main">' +
            '  <div style="margin:5px 0">运行命令快捷键：<b>Ctrl+Enter</b>；清除命令快捷键：<b>Ctrl+退格键</b><br />' +
            '按<b>F12键</b>可打开浏览器控制台查看消息（需切换至控制台或Console标签）</div>' +
            '  <textarea wrap="off" style="width:750px;height:300px;white-space:pre"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <button>运行</button><button>清除</button><button>关闭</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_run_command', '运行命令', html);
        var $textArea = $dialog.find('textarea');
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            var content = $textArea.val();
            if (!content) return;
            try {
                console.log(eval(content));
            }
            catch (ex) {
                console.log(ex);
            }
        }).next('button').click(function (e) {
            e.preventDefault();
            $textArea.val('').focus();
        }).next('button').click(function () {
            return Dialog.close('pd_run_command');
        });
        Dialog.show('pd_run_command');
        $textArea.keyup(function (e) {
            if (e.ctrlKey && e.keyCode === 13) {
                $dialog.find('.pd_cfg_btns > button:first').click();
            }
            else if (e.ctrlKey && e.keyCode === 8) {
                $dialog.find('.pd_cfg_btns > button:eq(1)').click();
            }
        }).focus();
    },

    /**
     * 显示导入或导出设置对话框
     */
    showImportOrExportSettingDialog: function () {
        if ($('#pd_im_or_ex_setting').length > 0) return;
        ConfigMethod.read();
        var html =
            '<div class="pd_cfg_main">' +
            '  <div>' +
            '    <strong>导入设置：</strong>将设置内容粘贴到文本框中并点击保存按钮即可<br />' +
            '    <strong>导出设置：</strong>复制文本框里的内容并粘贴到文本文件里即可' +
            '  </div>' +
            '  <textarea id="pd_cfg_setting" style="width:600px;height:400px;word-break:break-all"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <button>保存</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_im_or_ex_setting', '导入或导出设置', html);
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            if (!window.confirm('是否导入文本框中的设置？')) return;
            var options = $.trim($('#pd_cfg_setting').val());
            if (!options) return;
            try {
                options = JSON.parse(options);
            }
            catch (ex) {
                alert('设置有错误');
                return;
            }
            if (!options || $.type(options) !== 'object') {
                alert('设置有错误');
                return;
            }
            options = ConfigMethod.normalize(options);
            Config = $.extend(true, {}, ConfigMethod.defConfig, options);
            ConfigMethod.write();
            alert('设置已导入');
            location.reload();
        }).next('button').click(function () {
            return Dialog.close('pd_im_or_ex_setting');
        });
        Dialog.show('pd_im_or_ex_setting');
        $('#pd_cfg_setting').val(JSON.stringify(Tools.getDifferentValueOfObject(ConfigMethod.defConfig, Config))).select();
    },

    /**
     * 显示自定义各等级神秘颜色设置对话框
     */
    showCustomSmColorDialog: function () {
        if ($('#pd_custom_sm_color').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <div style="border-bottom:1px solid #9191FF;margin-bottom:7px;padding-bottom:5px"><strong>示例' +
            '（<a target="_blank" href="http://www.35ui.cn/jsnote/peise.html">常用配色表</a> / <a target="_blank" href="read.php?tid=488016">其他人分享的配色方案</a>）：' +
            '</strong><br /><b>等级范围：</b>4-4 <b>颜色：</b><span style="color:#0000FF">#0000FF</span><br /><b>等级范围：</b>10-99 <b>颜色：</b>' +
            '<span style="color:#5AD465">#5AD465</span><br /><b>等级范围：</b>5000-MAX <b>颜色：</b><span style="color:#FF0000">#FF0000</span></div>' +
            '  <ul id="pd_cfg_custom_sm_color_list"></ul>' +
            '  <div style="margin-top:5px" id="pd_cfg_custom_sm_color_add_btns"><a href="#">增加1个</a><a href="#" style="margin-left:7px">增加5个</a>' +
            '<a href="#" style="margin-left:7px">清除所有</a></div>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a href="#">导入/导出配色方案</a></span>' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_custom_sm_color', '自定义各等级神秘颜色', html);
        var $customSmColorList = $dialog.find('#pd_cfg_custom_sm_color_list');
        $dialog.find('.pd_cfg_btns > button:last').click(function () {
            return Dialog.close('pd_custom_sm_color');
        });

        $customSmColorList.on('keyup', '.pd_cfg_sm_color', function () {
            var $this = $(this);
            var color = $.trim($this.val());
            if (/^#[0-9a-fA-F]{6}$/.test(color)) {
                $this.next('input[type="color"]').val(color.toUpperCase());
            }
        }).on('change', 'input[type="color"]', function () {
            var $this = $(this);
            $this.prev('input').val($this.val().toString().toUpperCase());
        }).on('click', 'a', function (e) {
            e.preventDefault();
            $(this).closest('li').remove();
        });

        var getSmColorListLine = function (data) {
            if (!data) data = {};
            return ('<li><label>等级范围<input class="pd_cfg_sm_min" type="text" maxlength="5" style="width:30px" value="{0}" /></label>' +
            '<label>-<input class="pd_cfg_sm_max" type="text" maxlength="5" style="width:30px" value="{1}" /></label>' +
            '<label>颜色<input class="pd_cfg_sm_color" type="text" maxlength="7" style="width:50px" value="{2}" />' +
            '<input style="margin-left:0" type="color" value="{2}"></label> <a href="#">删除</a></li>')
                .replace('{0}', typeof data.min === 'undefined' ? '' : data.min)
                .replace('{1}', typeof data.max === 'undefined' ? '' : data.max)
                .replace(/\{2\}/g, typeof data.color === 'undefined' ? '' : data.color);
        };

        $dialog.find('#pd_cfg_custom_sm_color_add_btns').find('a:lt(2)').click(function (e) {
            e.preventDefault();
            var num = 1;
            if ($(this).is('#pd_cfg_custom_sm_color_add_btns > a:eq(1)')) num = 5;
            for (var i = 1; i <= num; i++) {
                $customSmColorList.append(getSmColorListLine());
            }
            Dialog.show('pd_custom_sm_color');
        }).end().find('a:last').click(function (e) {
            e.preventDefault();
            if (window.confirm('是否清除所有设置？')) {
                $customSmColorList.empty();
                Dialog.show('pd_custom_sm_color');
            }
        });

        $dialog.find('.pd_cfg_about > a').click(function (e) {
            e.preventDefault();
            ConfigDialog.showImportOrExportSmColorConfigDialog();
        });

        var smColorHtml = '';
        $.each(Config.customSmColorConfigList, function (index, data) {
            smColorHtml += getSmColorListLine(data);
        });
        $customSmColorList.html(smColorHtml);

        $dialog.submit(function (e) {
            e.preventDefault();
            var list = [];
            var verification = true;
            $customSmColorList.find('li').each(function () {
                var $this = $(this);
                var $txtSmMin = $this.find('.pd_cfg_sm_min');
                var smMin = $.trim($txtSmMin.val()).toUpperCase();
                if (smMin === '') return;
                if (!/^(-?\d+|MAX)$/i.test(smMin)) {
                    verification = false;
                    $txtSmMin.select();
                    $txtSmMin.focus();
                    alert('等级范围格式不正确');
                    return false;
                }
                var $txtSmMax = $this.find('.pd_cfg_sm_max');
                var smMax = $.trim($txtSmMax.val()).toUpperCase();
                if (smMax === '') return;
                if (!/^(-?\d+|MAX)$/i.test(smMax)) {
                    verification = false;
                    $txtSmMax.select();
                    $txtSmMax.focus();
                    alert('等级范围格式不正确');
                    return false;
                }
                if (Tools.compareSmLevel(smMax, smMin) < 0) {
                    verification = false;
                    $txtSmMin.select();
                    $txtSmMin.focus();
                    alert('等级范围格式不正确');
                    return false;
                }
                var $txtSmColor = $this.find('.pd_cfg_sm_color');
                var smColor = $.trim($txtSmColor.val()).toUpperCase();
                if (smColor === '') return;
                if (!/^#[0-9a-fA-F]{6}$/.test(smColor)) {
                    verification = false;
                    $txtSmColor.select();
                    $txtSmColor.focus();
                    alert('颜色格式不正确');
                    return false;
                }
                list.push({min: smMin, max: smMax, color: smColor});
            });
            if (verification) {
                list.sort(function (a, b) {
                    return Tools.compareSmLevel(a.min, b.min) > 0;
                });
                Config.customSmColorConfigList = list;
                ConfigMethod.write();
                Dialog.close('pd_custom_sm_color');
            }
        });

        Dialog.show('pd_custom_sm_color');
        if ($customSmColorList.find('input').length > 0) $customSmColorList.find('input:first').focus();
        else $('#pd_cfg_custom_sm_color_add_btns > a:first').focus();
    },

    /**
     * 显示导入或导出配色方案对话框
     */
    showImportOrExportSmColorConfigDialog: function () {
        if ($('#pd_im_or_ex_sm_color_config').length > 0) return;
        ConfigMethod.read();
        var html =
            '<div class="pd_cfg_main">' +
            '  <div>' +
            '    <strong>导入配色方案：</strong>将设置内容粘贴到文本框中并点击保存按钮即可<br />' +
            '    <strong>导出配色方案：</strong>复制文本框里的内容并粘贴到文本文件里即可' +
            '  </div>' +
            '  <textarea id="pd_cfg_sm_color_config" style="width:420px;height:200px;word-break:break-all"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a target="_blank" href="read.php?tid=488016">其他人分享的配色方案</a></span>' +
            '  <button>保存</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_im_or_ex_sm_color_config', '导入或导出配色方案', html);
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            if (!window.confirm('是否导入文本框中的设置？')) return;
            var options = $.trim($('#pd_cfg_sm_color_config').val());
            if (!options) return;
            try {
                options = JSON.parse(options);
            }
            catch (ex) {
                alert('配色方案有错误');
                return;
            }
            if (!options || $.type(options) !== 'array') {
                alert('配色方案有错误');
                return;
            }
            Config.customSmColorConfigList = options;
            ConfigMethod.write();
            alert('配色方案已导入');
            location.reload();
        }).next('button').click(function () {
            return Dialog.close('pd_im_or_ex_sm_color_config');
        });
        Dialog.show('pd_im_or_ex_sm_color_config');
        $dialog.find('#pd_cfg_sm_color_config').val(JSON.stringify(Config.customSmColorConfigList)).select();
    },

    /**
     * 显示自定义怪物名称对话框
     */
    showCustomMonsterNameDialog: function () {
        if ($('#pd_custom_monster_name').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <table id="pd_cfg_custom_monster_name_list">' +
            '    <tbody>' +
            '      <tr><th style="width:120px">怪物</th><th>自定义名称</th></tr>' +
            '      <tr><td>Lv.1：小史莱姆</td><td><input type="text" maxlength="18" data-id="1" /></td></tr>' +
            '      <tr><td>Lv.2：笨蛋</td><td><input type="text" maxlength="18" data-id="2" /></td></tr>' +
            '      <tr><td>Lv.3：大果冻史莱姆</td><td><input type="text" maxlength="18" data-id="3" /></td></tr>' +
            '      <tr><td>Lv.4：肉山</td><td><input type="text" maxlength="18" data-id="4" /></td></tr>' +
            '      <tr><td>Lv.5：大魔王</td><td><input type="text" maxlength="18" data-id="5" /></td></tr>' +
            '    </tbody>' +
            '  </table>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <button>确定</button><button>取消</button><button>重置</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_custom_monster_name', '自定义怪物名称', html);
        $dialog.submit(function (e) {
            e.preventDefault();
            Config.customMonsterNameList = {};
            $('#pd_cfg_custom_monster_name_list input').each(function () {
                var $this = $(this);
                var name = $.trim($this.val());
                if (name !== '') {
                    Config.customMonsterNameList[parseInt($this.data('id'))] = name;
                }
            });
            ConfigMethod.write();
            Dialog.close('pd_custom_monster_name');
        }).find('.pd_cfg_btns > button:eq(1)').click(function () {
            return Dialog.close('pd_custom_monster_name');
        }).next('button').click(function (e) {
            e.preventDefault();
            $('#pd_cfg_custom_monster_name_list input').val('');
        });
        $.each(Config.customMonsterNameList, function (id, name) {
            $('#pd_cfg_custom_monster_name_list input[data-id="{0}"]'.replace('{0}', id)).val(name);
        });
        Dialog.show('pd_custom_monster_name');
        $('#pd_cfg_custom_monster_name_list input:first').focus();
    },

    /**
     * 显示自定义CSS对话框
     */
    showCustomCssDialog: function () {
        if ($('#pd_custom_css').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <strong>自定义CSS内容：</strong><br />' +
            '  <textarea wrap="off" style="width:750px;height:400px;white-space:pre"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a target="_blank" href="read.php?tid=500969">其他人分享的CSS规则</a></span>' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_custom_css', '自定义CSS', html);
        var $content = $dialog.find('textarea');
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            Config.customCssContent = $.trim($content.val());
            ConfigMethod.write();
            Dialog.close('pd_custom_css');
        }).next('button').click(function () {
            return Dialog.close('pd_custom_css');
        });
        $content.val(Config.customCssContent);
        Dialog.show('pd_custom_css');
        $content.focus();
    },

    /**
     * 显示自定义脚本对话框
     */
    showCustomScriptDialog: function () {
        if ($('#pd_custom_script').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <label><strong>在脚本开始时执行的内容：</strong><br />' +
            '<textarea wrap="off" id="pd_custom_script_start_content" style="width:750px;height:250px;white-space:pre;margin-bottom:10px"></textarea></label><br />' +
            '  <label><strong>在脚本结束时执行的内容：</strong><br />' +
            '<textarea wrap="off" id="pd_custom_script_end_content" style="width:750px;height:250px;white-space:pre"></textarea></label>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a target="_blank" href="read.php?tid=500968">其他人分享的自定义脚本</a></span>' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_custom_script', '自定义脚本', html);
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            Config.customScriptStartContent = $('#pd_custom_script_start_content').val();
            Config.customScriptEndContent = $('#pd_custom_script_end_content').val();
            ConfigMethod.write();
            Dialog.close('pd_custom_script');
        }).next('button').click(function () {
            return Dialog.close('pd_custom_script');
        });
        $dialog.find('#pd_custom_script_start_content').val(Config.customScriptStartContent)
            .end().find('#pd_custom_script_end_content').val(Config.customScriptEndContent);
        Dialog.show('pd_custom_script');
        $dialog.find('#pd_custom_script_start_content').focus();
    },

    /**
     * 显示用户备注对话框
     */
    showUserMemoDialog: function () {
        if ($('#pd_user_memo').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  按照“用户名:备注”的格式（注意是英文冒号），每行一个<br />' +
            '  <textarea wrap="off" style="width:320px;height:400px;white-space:pre"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_user_memo', '用户备注', html);
        var $userMemoList = $dialog.find('textarea');
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            var content = $.trim($userMemoList.val());
            Config.userMemoList = {};
            var lines = content.split('\n');
            for (var i in lines) {
                var line = $.trim(lines[i]);
                if (!line) continue;
                if (!/.+?:.+/.test(line)) {
                    alert('用户备注格式不正确');
                    $userMemoList.focus();
                    return;
                }
                var valueArr = line.split(':');
                if (valueArr.length < 2) continue;
                var user = $.trim(valueArr[0]);
                var memo = $.trim(valueArr[1]);
                if (!user || !memo) continue;
                Config.userMemoList[user] = memo;
            }
            ConfigMethod.write();
            Dialog.close('pd_user_memo');
        }).next('button').click(function () {
            return Dialog.close('pd_user_memo');
        });
        var content = '';
        for (var user in Config.userMemoList) {
            content += '{0}:{1}\n'.replace('{0}', user).replace('{1}', Config.userMemoList[user]);
        }
        $userMemoList.val(content);
        Dialog.show('pd_user_memo');
        $userMemoList.focus();
    },

    /**
     * 显示关注用户对话框
     */
    showFollowUserDialog: function () {
        if ($('#pd_follow_user').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <div style="margin-top:5px">' +
            '    <label><input id="pd_cfg_highlight_follow_user_thread_in_hp_enabled" type="checkbox" />高亮所关注用户的首页帖子链接 ' +
            '<span class="pd_cfg_tips" title="高亮所关注用户在首页下的帖子链接">[?]</span></label><br />' +
            '    <label><input id="pd_cfg_highlight_follow_user_thread_link_enabled" type="checkbox" />高亮所关注用户的帖子链接 ' +
            '<span class="pd_cfg_tips" title="高亮所关注用户在帖子列表页面下的帖子链接">[?]</span></label><br />' +
            '  </div>' +
            '  <ul id="pd_cfg_follow_user_list" style="margin-top:5px;width:274px;line-height:24px"></ul>' +
            '  <div id="pd_cfg_follow_user_btns" style="margin-top:5px;">' +
            '    <div style="display:inline-block"><a href="#">全选</a><a style="margin-left:7px" href="#">反选</a></div>' +
            '    <div style="float:right"><a style="margin-left:7px" href="#">删除</a></div>' +
            '  </div>' +
            '  <div style="margin-top:5px" title="添加多个用户请用英文逗号分隔"><input id="pd_cfg_add_follow_user" style="width:200px" type="text" />' +
            '<a style="margin-left:7px" href="#">添加</a></div>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a href="#">导入/导出关注用户</a></span>' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_follow_user', '关注用户', html);
        var $followUserList = $dialog.find('#pd_cfg_follow_user_list');
        $dialog.submit(function (e) {
            e.preventDefault();
            $dialog.find('.pd_cfg_btns > button:first').click();
        }).find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            Config.highlightFollowUserThreadInHPEnabled = $('#pd_cfg_highlight_follow_user_thread_in_hp_enabled').prop('checked');
            Config.highlightFollowUserThreadLinkEnabled = $('#pd_cfg_highlight_follow_user_thread_link_enabled').prop('checked');
            Config.followUserList = [];
            $followUserList.find('li').each(function () {
                var $this = $(this);
                var name = $.trim($this.find('input[type="text"]').val());
                if (name !== '' && Tools.inFollowOrBlockUserList(name, Config.followUserList) === -1) {
                    Config.followUserList.push({name: name});
                }
            });
            ConfigMethod.write();
            Dialog.close('pd_follow_user');
        }).end().find('.pd_cfg_btns > button:last').click(function () {
            return Dialog.close('pd_follow_user');
        });

        $('#pd_cfg_highlight_follow_user_thread_in_hp_enabled').prop('checked', Config.highlightFollowUserThreadInHPEnabled);
        $('#pd_cfg_highlight_follow_user_thread_link_enabled').prop('checked', Config.highlightFollowUserThreadLinkEnabled);

        /**
         * 添加关注用户
         * @param {string} name 用户名
         */
        var addFollowUser = function (name) {
            $(
                ('<li><input type="checkbox" /><input type="text" style="width:178px;margin-left:5px" maxlength="15" value="{0}" />' +
                '<a style="margin-left:7px" href="#">删除</a></li>')
                    .replace('{0}', name)
            ).appendTo($followUserList);
        };

        for (var i in Config.followUserList) {
            addFollowUser(Config.followUserList[i].name);
        }

        $followUserList.on('click', 'a', function (e) {
            e.preventDefault();
            $(this).parent().remove();
        });

        $('#pd_cfg_follow_user_btns').find('a:first')
            .click(function (e) {
                e.preventDefault();
                $followUserList.find('input[type="checkbox"]').prop('checked', true);
            })
            .end()
            .find('a:eq(1)')
            .click(function (e) {
                e.preventDefault();
                $followUserList.find('input[type="checkbox"]').each(function () {
                    $(this).prop('checked', !$(this).prop('checked'));
                });
            })
            .end()
            .find('a:last')
            .click(function (e) {
                e.preventDefault();
                var $checked = $followUserList.find('li:has(input[type="checkbox"]:checked)');
                if ($checked.length === 0) return;
                if (window.confirm('是否删除所选用户？')) {
                    $checked.remove();
                    Dialog.show('pd_follow_user');
                }
            });

        $dialog.find('#pd_cfg_add_follow_user').keydown(function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                $(this).next('a').click();
            }
        }).next('a').click(function (e) {
            e.preventDefault();
            var users = $.trim($('#pd_cfg_add_follow_user').val()).split(',');
            if (!users || $.trim(users[0]) === '') return;
            for (var i in users) {
                var name = $.trim(users[i]);
                if (name === '') continue;
                if (Tools.inFollowOrBlockUserList(name, Config.followUserList) === -1) {
                    addFollowUser(name);
                }
            }
            $('#pd_cfg_add_follow_user').val('');
            Dialog.show('pd_follow_user');
        });

        $dialog.find('.pd_cfg_about > a').click(function (e) {
            e.preventDefault();
            ConfigDialog.showCommonImportOrExportConfigDialog(1);
        });

        Dialog.show('pd_follow_user');
        $('#pd_cfg_highlight_follow_user_thread_in_hp_enabled').focus();
    },

    /**
     * 显示屏蔽用户对话框
     */
    showBlockUserDialog: function () {
        if ($('#pd_block_user').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <div style="margin-top:5px;line-height:24px">' +
            '    <label>默认屏蔽类型<select id="pd_cfg_block_user_default_type"><option value="0">屏蔽主题和回帖</option>' +
            '<option value="1">仅屏蔽主题</option><option value="2">仅屏蔽回帖</option></select></label>' +
            '    <label style="margin-left:10px"><input id="pd_cfg_block_user_at_tips_enabled" type="checkbox" />屏蔽@提醒 ' +
            '<span class="pd_cfg_tips" title="屏蔽被屏蔽用户的@提醒">[?]</span></label><br />' +
            '    <label>版块屏蔽范围<select id="pd_cfg_block_user_forum_type"><option value="0">所有版块</option><option value="1">包括指定版块</option>' +
            '<option value="2">排除指定版块</option></select></label><br />' +
            '    <label>版块ID列表<input id="pd_cfg_block_user_fid_list" type="text" style="width:220px" /> ' +
            '<span class="pd_cfg_tips" title="版块URL中的fid参数，多个ID请用英文逗号分隔">[?]</span></label>' +
            '  </div>' +
            '  <ul id="pd_cfg_block_user_list" style="margin-top:5px;width:362px;line-height:24px"></ul>' +
            '  <div id="pd_cfg_block_user_btns" style="margin-top:5px;">' +
            '    <div style="display:inline-block"><a href="#">全选</a><a style="margin-left:7px" href="#">反选</a></div>' +
            '    <div style="float:right"><a href="#">修改为</a><select style="margin-left:7px"><option value="0">屏蔽主题和回帖</option>' +
            '<option value="1">仅屏蔽主题</option><option value="2">仅屏蔽回帖</option></select><a style="margin-left:7px" href="#">删除</a></div>' +
            '  </div>' +
            '  <div style="margin-top:5px" title="添加多个用户请用英文逗号分隔"><input id="pd_cfg_add_block_user" style="width:200px" type="text" />' +
            '<a style="margin-left:7px" href="#">添加</a></div>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a href="#">导入/导出屏蔽用户</a></span>' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_block_user', '屏蔽用户', html);
        var $blockUserList = $dialog.find('#pd_cfg_block_user_list');
        $dialog.submit(function (e) {
            e.preventDefault();
            $dialog.find('.pd_cfg_btns > button:first').click();
        }).find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            Config.blockUserDefaultType = $('#pd_cfg_block_user_default_type').val();
            Config.blockUserAtTipsEnabled = $('#pd_cfg_block_user_at_tips_enabled').prop('checked');
            Config.blockUserForumType = parseInt($('#pd_cfg_block_user_forum_type').val());
            Config.blockUserFidList = [];
            $.each($.trim($('#pd_cfg_block_user_fid_list').val()).split(','), function (i, fid) {
                fid = parseInt($.trim(fid));
                if (!isNaN(fid) && fid > 0) Config.blockUserFidList.push(fid);
            });
            Config.blockUserList = [];
            $blockUserList.find('li').each(function () {
                var $this = $(this);
                var name = $.trim($this.find('input[type="text"]').val());
                if (name !== '' && Tools.inFollowOrBlockUserList(name, Config.blockUserList) === -1) {
                    var type = parseInt($this.find('select').val());
                    Config.blockUserList.push({name: name, type: type});
                }
            });
            ConfigMethod.write();
            Dialog.close('pd_block_user');
        }).end().find('.pd_cfg_btns > button:last').click(function () {
            return Dialog.close('pd_block_user');
        });

        $('#pd_cfg_block_user_default_type').val(Config.blockUserDefaultType);
        $('#pd_cfg_block_user_at_tips_enabled').prop('checked', Config.blockUserAtTipsEnabled);
        $('#pd_cfg_block_user_forum_type').val(Config.blockUserForumType);
        $('#pd_cfg_block_user_fid_list').val(Config.blockUserFidList.join(','));

        /**
         * 添加屏蔽用户
         * @param {string} name 用户名
         * @param {number} type 屏蔽类型
         */
        var addBlockUser = function (name, type) {
            $(
                ('<li><input type="checkbox" /><input type="text" style="width:150px;margin-left:5px" maxlength="15" value="{0}" />' +
                '<select style="margin-left:5px"><option value="0">屏蔽主题和回帖</option><option value="1">仅屏蔽主题</option>' +
                '<option value="2">仅屏蔽回帖</option></select><a style="margin-left:7px" href="#">删除</a></li>')
                    .replace('{0}', name)
            ).appendTo($blockUserList)
                .find('select').val(type);
        };

        for (var i in Config.blockUserList) {
            addBlockUser(Config.blockUserList[i].name, Config.blockUserList[i].type);
        }

        $blockUserList.on('click', 'a', function (e) {
            e.preventDefault();
            $(this).parent().remove();
        });

        $('#pd_cfg_block_user_btns').find('a:first')
            .click(function (e) {
                e.preventDefault();
                $blockUserList.find('input[type="checkbox"]').prop('checked', true);
            })
            .end()
            .find('a:eq(1)')
            .click(function (e) {
                e.preventDefault();
                $blockUserList.find('input[type="checkbox"]').each(function () {
                    $(this).prop('checked', !$(this).prop('checked'));
                });
            })
            .end()
            .find('a:eq(2)')
            .click(function (e) {
                e.preventDefault();
                var value = $(this).next('select').val();
                $blockUserList.find('li:has(input[type="checkbox"]:checked) > select').val(value);
            })
            .end()
            .find('a:last')
            .click(function (e) {
                e.preventDefault();
                var $checked = $blockUserList.find('li:has(input[type="checkbox"]:checked)');
                if ($checked.length === 0) return;
                if (window.confirm('是否删除所选用户？')) {
                    $checked.remove();
                    Dialog.show('pd_block_user');
                }
            });

        $dialog.find('#pd_cfg_add_block_user').keydown(function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                $(this).next('a').click();
            }
        }).next('a').click(function (e) {
            e.preventDefault();
            var users = $.trim($('#pd_cfg_add_block_user').val()).split(',');
            var type = parseInt($('#pd_cfg_block_user_default_type').val());
            if (!users || $.trim(users[0]) === '') return;
            for (var i in users) {
                var name = $.trim(users[i]);
                if (name === '') continue;
                if (Tools.inFollowOrBlockUserList(name, Config.blockUserList) === -1) {
                    addBlockUser(name, type);
                }
            }
            $('#pd_cfg_add_block_user').val('');
            Dialog.show('pd_block_user');
        });

        $dialog.find('#pd_cfg_block_user_forum_type').change(function () {
            $('#pd_cfg_block_user_fid_list').prop('disabled', parseInt($(this).val()) === 0);
        }).end().find('.pd_cfg_about > a').click(function (e) {
            e.preventDefault();
            ConfigDialog.showCommonImportOrExportConfigDialog(2);
        });

        Dialog.show('pd_block_user');
        $('#pd_cfg_block_user_forum_type').triggerHandler('change');
        $('#pd_cfg_block_user_default_type').focus();
    },

    /**
     * 显示屏蔽帖子对话框
     */
    showBlockThreadDialog: function () {
        if ($('#pd_block_thread').length > 0) return;
        var html =
            '<div class="pd_cfg_main">' +
            '  <div style="border-bottom:1px solid #9191FF;margin-bottom:7px;padding-bottom:5px">' +
            '    标题关键字可使用普通字符串或正则表达式，正则表达式请使用/abc/的格式，例：/关键字A.*关键字B/i<br />' +
            '    用户名和版块ID为可选项（多个用户名或版块ID请用英文逗号分隔）<br />' +
            '    <label>默认版块屏蔽范围<select id="pd_cfg_block_thread_def_forum_type"><option value="0">所有版块</option><option value="1">包括指定版块</option>' +
            '<option value="2">排除指定版块</option></select></label>' +
            '    <label style="margin-left:5px">默认版块ID列表<input id="pd_cfg_block_thread_def_fid_list" type="text" style="width:150px" /></label>' +
            '  </div>' +
            '  <table id="pd_cfg_block_thread_list" style="line-height:22px;text-align:center">' +
            '    <tbody>' +
            '      <tr>' +
            '        <th style="width:187px">标题关键字(必填)</th>' +
            '        <th style="width:132px">用户名 <span class="pd_cfg_tips" title="多个用户名请用英文逗号分隔">[?]</span></th>' +
            '        <th style="width:105px">屏蔽范围</th>' +
            '        <th style="width:132px">版块ID <span class="pd_cfg_tips" title="版块URL中的fid参数，多个ID请用英文逗号分隔">[?]</span></th>' +
            '        <th style="width:35px"></th>' +
            '      </tr>' +
            '    </tbody>' +
            '  </table>' +
            '  <div style="margin-top:5px" id="pd_cfg_block_thread_add_btns"><a href="#">增加1个</a><a href="#" style="margin-left:7px">增加5个</a>' +
            '<a href="#" style="margin-left:7px">清除所有</a></div>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a href="#">导入/导出屏蔽帖子</a></span>' +
            '  <button>确定</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_block_thread', '屏蔽帖子', html, 'width:648px');
        var $blockThreadList = $dialog.find('#pd_cfg_block_thread_list');

        /**
         * 验证设置是否正确
         * @returns {boolean} 是否验证通过
         */
        var verify = function () {
            var flag = true;
            $blockThreadList.find('tr:gt(0)').each(function () {
                var $this = $(this);
                var $txtKeyWord = $this.find('td:first-child > input');
                var keyWord = $txtKeyWord.val();
                if ($.trim(keyWord) === '') return;
                if (/^\/.+\/[gimy]*$/.test(keyWord)) {
                    try {
                        eval(keyWord);
                    }
                    catch (ex) {
                        alert('正则表达式不正确');
                        $txtKeyWord.select();
                        $txtKeyWord.focus();
                        flag = false;
                        return false;
                    }
                }
            });
            return flag;
        };

        $dialog.submit(function (e) {
            e.preventDefault();
            $dialog.find('.pd_cfg_btns > button:first').click();
        }).find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            if (!verify()) return;
            Config.blockThreadDefForumType = parseInt($('#pd_cfg_block_thread_def_forum_type').val());
            Config.blockThreadDefFidList = [];
            $.each($.trim($('#pd_cfg_block_thread_def_fid_list').val()).split(','), function (i, fid) {
                fid = parseInt($.trim(fid));
                if (!isNaN(fid) && fid > 0) Config.blockThreadDefFidList.push(fid);
            });
            Config.blockThreadList = [];
            $blockThreadList.find('tr:gt(0)').each(function () {
                var $this = $(this);
                var keyWord = $this.find('td:first-child > input').val();
                if ($.trim(keyWord) === '') return;
                var newObj = {keyWord: keyWord};

                var userNameList = [];
                $.each($.trim($this.find('td:nth-child(2) > input').val()).split(','), function (i, userName) {
                    userName = $.trim(userName);
                    if (userName) userNameList.push(userName);
                });
                if (userNameList.length > 0) newObj.userName = userNameList;

                var type = parseInt($this.find('td:nth-child(3) > select').val());
                if (type > 0) {
                    var fidList = [];
                    $.each($.trim($this.find('td:nth-child(4) > input').val()).split(','), function (i, fid) {
                        fid = parseInt($.trim(fid));
                        if (!isNaN(fid) && fid > 0) fidList.push(fid);
                    });
                    if (fidList.length > 0) newObj[type === 2 ? 'excludeFid' : 'includeFid'] = fidList;
                }
                Config.blockThreadList.push(newObj);
            });
            ConfigMethod.write();
            Dialog.close('pd_block_thread');
        }).end().find('.pd_cfg_btns > button:last').click(function () {
            return Dialog.close('pd_block_thread');
        });

        $blockThreadList.on('change', 'select', function () {
            var $this = $(this);
            $this.parent('td').next('td').find('input').prop('disabled', parseInt($this.val()) === 0);
        }).on('click', 'td > a', function (e) {
            e.preventDefault();
            $(this).closest('tr').remove();
        });

        /**
         * 添加屏蔽帖子
         * @param {string} keyWord 标题关键字
         * @param {string[]} userNameList 用户名
         * @param {number} type 屏蔽范围，0：所有版块；1：包括指定版块；2：排除指定版块
         * @param {number[]} fidList 版块ID列表
         */
        var addBlockThread = function (keyWord, userNameList, type, fidList) {
            $(
                ('<tr>' +
                '  <td><input type="text" style="width:175px" value="{0}" /></td>' +
                '  <td><input type="text" style="width:120px" value="{1}" /></td>' +
                '  <td><select style="margin-left:5px"><option value="0">所有版块</option><option value="1">包括指定版块</option>' +
                '<option value="2">排除指定版块</option></select></td>' +
                '  <td><input type="text" style="width:120px" value="{2}" {3} /></td>' +
                '  <td><a href="#">删除</a></td>' +
                '</tr>')
                    .replace('{0}', keyWord)
                    .replace('{1}', userNameList.join(','))
                    .replace('{2}', fidList.join(','))
                    .replace('{3}', type === 0 ? 'disabled="disabled"' : '')
            ).appendTo($blockThreadList)
                .find('select').val(type);
        };

        for (var i in Config.blockThreadList) {
            var userName = Config.blockThreadList[i].userName;
            var type = 0;
            var fidList = [];
            if (typeof Config.blockThreadList[i].includeFid !== 'undefined') {
                type = 1;
                fidList = Config.blockThreadList[i].includeFid;
            }
            else if (typeof Config.blockThreadList[i].excludeFid !== 'undefined') {
                type = 2;
                fidList = Config.blockThreadList[i].excludeFid;
            }
            addBlockThread(Config.blockThreadList[i].keyWord, userName ? userName : [], type, fidList);
        }

        $('#pd_cfg_block_thread_add_btns').find('a:lt(2)').click(function (e) {
            e.preventDefault();
            var num = 1;
            if ($(this).is('#pd_cfg_block_thread_add_btns > a:eq(1)')) num = 5;
            for (var i = 1; i <= num; i++) {
                addBlockThread('', [], parseInt($('#pd_cfg_block_thread_def_forum_type').val()), $.trim($('#pd_cfg_block_thread_def_fid_list').val()).split(','));
            }
            Dialog.show('pd_block_thread');
        }).end().find('a:last').click(function (e) {
            e.preventDefault();
            if (window.confirm('是否清除所有屏蔽关键字？')) {
                $blockThreadList.find('tbody > tr:gt(0)').remove();
                Dialog.show('pd_block_thread');
            }
        });

        $dialog.find('#pd_cfg_block_thread_def_forum_type').change(function () {
            $('#pd_cfg_block_thread_def_fid_list').prop('disabled', parseInt($(this).val()) === 0);
        }).end().find('.pd_cfg_about > a').click(function (e) {
            e.preventDefault();
            ConfigDialog.showCommonImportOrExportConfigDialog(3);
        });

        Dialog.show('pd_block_thread');
        $('#pd_cfg_block_thread_def_forum_type').val(Config.blockThreadDefForumType).focus().triggerHandler('change');
        $('#pd_cfg_block_thread_def_fid_list').val(Config.blockThreadDefFidList.join(','));
    },

    /**
     * 显示通用的导入/导出设置对话框
     * @param {number} type 1：关注用户；2：屏蔽用户；3：屏蔽帖子
     */
    showCommonImportOrExportConfigDialog: function (type) {
        if ($('#pd_common_im_or_ex_config').length > 0) return;
        ConfigMethod.read();
        var html =
            '<div class="pd_cfg_main">' +
            '  <div>' +
            '    <strong>导入设置：</strong>将设置内容粘贴到文本框中并点击保存按钮即可<br />' +
            '    <strong>导出设置：</strong>复制文本框里的内容并粘贴到文本文件里即可' +
            '  </div>' +
            '  <textarea id="pd_cfg_common_config" style="width:420px;height:200px;word-break:break-all"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <button>保存</button><button>取消</button>' +
            '</div>';
        var title = '关注用户';
        if (type === 2) title = '屏蔽用户';
        else if (type === 3) title = '屏蔽帖子';
        var $dialog = Dialog.create('pd_common_im_or_ex_config', '导入或导出{0}'.replace('{0}', title), html);
        $dialog.find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            if (!window.confirm('是否导入文本框中的设置？')) return;
            var options = $.trim($('#pd_cfg_common_config').val());
            if (!options) return;
            try {
                options = JSON.parse(options);
            }
            catch (ex) {
                alert('设置有错误');
                return;
            }
            if (!options || $.type(options) !== 'array') {
                alert('设置有错误');
                return;
            }
            if (type === 2) Config.blockUserList = options;
            else if (type === 3) Config.blockThreadList = options;
            else Config.followUserList = options;
            ConfigMethod.write();
            alert('设置已导入');
            location.reload();
        }).next('button').click(function () {
            return Dialog.close('pd_common_im_or_ex_config');
        });
        Dialog.show('pd_common_im_or_ex_config');

        var options = Config.followUserList;
        if (type === 2) options = Config.blockUserList;
        else if (type === 3) options = Config.blockThreadList;
        $dialog.find('#pd_cfg_common_config').val(JSON.stringify(options)).select();
    }
};

/**
 * 日志类
 */
var Log = {
    // 保存日志的键值名称
    name: 'pd_log',
    // 日志对象
    log: {},

    /**
     * 读取日志
     */
    read: function () {
        Log.log = {};
        var log = null;
        if (storageType === 'Script' || storageType === 'Global') log = GM_getValue(Log.name + '_' + KFOL.uid);
        else log = localStorage.getItem(Log.name + '_' + KFOL.uid);
        if (!log) return;
        try {
            log = JSON.parse(log);
        }
        catch (ex) {
            return;
        }
        if (!log || $.type(log) !== 'object') return;
        Log.log = log;
        if (!Tools.getCookie(Const.checkOverdueLogCookieName)) Log.deleteOverdueLog();
    },

    /**
     * 写入日志
     */
    write: function () {
        if (storageType === 'Script' || storageType === 'Global') GM_setValue(Log.name + '_' + KFOL.uid, JSON.stringify(Log.log));
        else localStorage.setItem(Log.name + '_' + KFOL.uid, JSON.stringify(Log.log));
    },

    /**
     * 清除日志
     */
    clear: function () {
        if (storageType === 'Script' || storageType === 'Global') GM_deleteValue(Log.name + '_' + KFOL.uid);
        else localStorage.removeItem(Log.name + '_' + KFOL.uid);
    },

    /**
     * 删除过期日志
     */
    deleteOverdueLog: function () {
        var dateList = Tools.getObjectKeyList(Log.log, 1);
        var overdueDate = Tools.getDateString(Tools.getDate('-' + Config.logSaveDays + 'd'));
        var isDeleted = false;
        for (var i in dateList) {
            if (dateList[i] <= overdueDate) {
                delete Log.log[dateList[i]];
                isDeleted = true;
            }
            else break;
        }
        if (isDeleted) Log.write();
        Tools.setCookie(Const.checkOverdueLogCookieName, 1, Tools.getMidnightHourDate(1));
    },

    /**
     * 记录一条新日志
     * @param {string} type 日志类别
     * @param {string} action 行为
     * @param {{}} [options] 设置对象
     * @param {{}} [options.gain] 收获
     * @param {{}} [options.pay] 付出
     * @param {boolean} [options.notStat=false] 是否不参与统计
     */
    push: function (type, action, options) {
        var defaults = {
            time: 0,
            type: '',
            action: '',
            gain: {},
            pay: {},
            notStat: false
        };
        var settings = $.extend({}, defaults);
        if ($.type(options) === 'object') {
            $.extend(settings, options);
        }
        settings.type = type;
        settings.action = action;
        var date = new Date();
        settings.time = date.getTime();
        var today = Tools.getDateString(date);
        Log.read();
        if ($.type(Log.log[today]) !== 'array') Log.log[today] = [];
        Log.log[today].push(Tools.getDifferentValueOfObject(defaults, settings));
        Log.write();
    },

    /**
     * 显示日志对话框
     */
    show: function () {
        if ($('#pd_log').length > 0) return;
        Dialog.close('pd_config');
        ConfigMethod.read();
        var html =
            '<div class="pd_cfg_main">' +
            '  <div class="pd_log_nav">' +
            '    <a class="pd_disabled_link" href="#">&lt;&lt;</a>' +
            '    <a style="padding:0 7px" class="pd_disabled_link" href="#">&lt;</a>' +
            '    <h2 class="pd_custom_tips">暂无日志</h2>' +
            '    <a style="padding:0 7px" class="pd_disabled_link" href="#">&gt;</a>' +
            '    <a class="pd_disabled_link" href="#">&gt;&gt;</a>' +
            '  </div>' +
            '  <fieldset>' +
            '    <legend>日志内容</legend>' +
            '    <div>' +
            '      <strong>排序方式：</strong>' +
            '      <label title="按时间顺序排序"><input type="radio" name="pd_log_sort_type" value="time" checked="checked" />按时间</label>' +
            '      <label title="按日志类别排序"><input type="radio" name="pd_log_sort_type" value="type" />按类别</label>' +
            '    </div>' +
            '    <div class="pd_stat" id="pd_log_content">暂无日志</div>' +
            '  </fieldset>' +
            '  <fieldset>' +
            '    <legend>统计结果</legend>' +
            '    <div>' +
            '      <strong>统计范围：</strong>' +
            '      <label title="显示当天的统计结果"><input type="radio" name="pd_log_stat_type" value="cur" checked="checked" />当天</label>' +
            '      <label title="显示距该日N天内的统计结果"><input type="radio" name="pd_log_stat_type" value="custom" /></label>' +
            '<label title="显示距该日N天内的统计结果"><input id="pd_log_stat_days" type="text" style="width:22px" maxlength="3" />天内</label>' +
            '      <label title="显示全部统计结果"><input type="radio" name="pd_log_stat_type" value="all" />全部</label>' +
            '    </div>' +
            '    <div class="pd_stat" id="pd_log_stat">暂无日志</div>' +
            '  </fieldset>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <span class="pd_cfg_about"><a id="pd_log_im_or_ex_log_dialog" href="#">导入/导出日志</a></span>' +
            '  <button>关闭</button><button>清除日志</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_log', 'KF Online助手日志', html);

        Log.read();
        var dateList = [];
        var curIndex = 0;
        if (!$.isEmptyObject(Log.log)) {
            dateList = Tools.getObjectKeyList(Log.log, 1);
            curIndex = dateList.length - 1;
            $dialog.find('.pd_log_nav h2').attr('title', '总共记录了{0}天的日志'.replace('{0}', dateList.length)).text(dateList[curIndex]);
            if (dateList.length > 1) {
                $dialog.find('.pd_log_nav > a:eq(0)').attr('title', dateList[0]).removeClass('pd_disabled_link');
                $dialog.find('.pd_log_nav > a:eq(1)').attr('title', dateList[curIndex - 1]).removeClass('pd_disabled_link');
            }
        }
        $dialog.find('.pd_log_nav a').click(function (e) {
            e.preventDefault();
            if ($(this).is('.pd_log_nav a:eq(0)')) {
                curIndex = 0;
            }
            else if ($(this).is('.pd_log_nav a:eq(1)')) {
                if (curIndex > 0) curIndex--;
                else return;
            }
            else if ($(this).is('.pd_log_nav a:eq(2)')) {
                if (curIndex < dateList.length - 1) curIndex++;
                else return;
            }
            else if ($(this).is('.pd_log_nav a:eq(3)')) {
                curIndex = dateList.length - 1;
            }
            $dialog.find('.pd_log_nav h2').text(dateList[curIndex]);
            Log.showLogContent(dateList[curIndex]);
            Log.showLogStat(dateList[curIndex]);
            if (curIndex > 0) {
                $dialog.find('.pd_log_nav > a:eq(0)').attr('title', dateList[0]).removeClass('pd_disabled_link');
                $dialog.find('.pd_log_nav > a:eq(1)').attr('title', dateList[curIndex - 1]).removeClass('pd_disabled_link');
            }
            else {
                $dialog.find('.pd_log_nav > a:lt(2)').removeAttr('title').addClass('pd_disabled_link');
            }
            if (curIndex < dateList.length - 1) {
                $dialog.find('.pd_log_nav > a:eq(2)').attr('title', dateList[curIndex - 1]).removeClass('pd_disabled_link');
                $dialog.find('.pd_log_nav > a:eq(3)').attr('title', dateList[dateList.length - 1]).removeClass('pd_disabled_link');
            }
            else {
                $dialog.find('.pd_log_nav > a:gt(1)').removeAttr('title').addClass('pd_disabled_link');
            }
        }).end().find('input[name="pd_log_sort_type"]').click(function () {
            var value = $(this).val();
            if (Config.logSortType !== value) {
                Config.logSortType = value;
                ConfigMethod.write();
                Log.showLogContent(dateList[curIndex]);
            }
        }).end().find('input[name="pd_log_stat_type"]').click(function () {
            var value = $(this).val();
            if (Config.logStatType !== value) {
                Config.logStatType = value;
                ConfigMethod.write();
                Log.showLogStat(dateList[curIndex]);
            }
        }).end().find('#pd_log_stat_days').keyup(function () {
            var days = parseInt($.trim($(this).val()));
            if (days > 0 && Config.logStatDays !== days) {
                Config.logStatDays = days;
                ConfigMethod.write();
                $('input[name="pd_log_stat_type"][value="custom"]:not(:checked)').click();
                Log.showLogStat(dateList[curIndex]);
            }
        }).end().find('input[name="pd_log_sort_type"][value="{0}"]'.replace('{0}', Config.logSortType)).click()
            .end().find('input[name="pd_log_stat_type"][value="{0}"]'.replace('{0}', Config.logStatType)).click()
            .end().find('#pd_log_stat_days').val(Config.logStatDays);

        $dialog.find('.pd_cfg_btns > button:first').click(function () {
            return Dialog.close('pd_log');
        }).next('button').click(function (e) {
            e.preventDefault();
            if (window.confirm('是否清除所有日志？')) {
                Log.clear();
                alert('日志已清除');
                location.reload();
            }
        });

        $('#pd_log_im_or_ex_log_dialog').click(function (e) {
            e.preventDefault();
            Log.showImportOrExportLogDialog();
        });

        Log.showLogContent(dateList[curIndex]);
        Log.showLogStat(dateList[curIndex]);

        if ($(window).height() <= 750) $dialog.find('#pd_log_content').css('height', '216px');
        Dialog.show('pd_log');
        $dialog.find('input:first').focus();
    },

    /**
     * 显示指定日期的日志内容
     * @param {string} date 日志对象关键字
     */
    showLogContent: function (date) {
        if ($.type(Log.log[date]) !== 'array') return;
        $('#pd_log_content').html(Log.getLogContent(date, Config.logSortType))
            .parent().find('legend:first-child').text('日志内容 (共{0}项)'.replace('{0}', Log.log[date].length));
    },

    /**
     * 获取指定日期的日志内容
     * @param {string} date 日志对象关键字
     * @param {string} logSortType 日志内容的排序方式
     * @returns {string} 指定日期的日志内容
     */
    getLogContent: function (date, logSortType) {
        var logList = Log.log[date];
        if (logSortType === 'type') {
            var sortTypeList = ['捐款', '领取争夺奖励', '批量攻击', '试探攻击', '抽取神秘盒子', '抽取道具或卡片', '使用道具', '恢复道具', '循环使用道具', '将道具转换为能量',
                '将卡片转换为VIP时间', '购买道具', '统计道具购买价格', '出售道具', '神秘抽奖', '统计神秘抽奖结果', '神秘等级升级', '神秘系数排名变化', '批量转账', '购买帖子',
                '自动存款'];
            logList.sort(function (a, b) {
                return $.inArray(a.type, sortTypeList) > $.inArray(b.type, sortTypeList);
            });
        }
        else {
            logList.sort(function (a, b) {
                return a.time > b.time;
            });
        }

        var content = '', curType = '';
        $.each(logList, function (index, key) {
            if (typeof key.time === 'undefined' || typeof key.type === 'undefined' || typeof key.action === 'undefined') return;
            var d = new Date(key.time);
            if (logSortType === 'type') {
                if (curType !== key.type) {
                    content += '<h3>【{0}】</h3>'.replace('{0}', key.type);
                    curType = key.type;
                }
                content += '<p><b>{0}：</b>{1}'
                    .replace('{0}', Tools.getTimeString(d))
                    .replace('{1}', key.action.replace(/`([^`]+?)`/g, '<b style="color:#F00">$1</b>'));
            }
            else {
                content += '<p><b>{0} ({1})：</b>{2}'
                    .replace('{0}', Tools.getTimeString(d))
                    .replace('{1}', key.type)
                    .replace('{2}', key.action.replace(/`([^`]+?)`/g, '<b style="color:#F00">$1</b>'));
            }

            var stat = '';
            if ($.type(key.gain) === 'object' && !$.isEmptyObject(key.gain)) {
                stat += '，';
                for (var k in key.gain) {
                    if (k === 'item') {
                        for (var itemName in key.gain['item']) {
                            stat += '<i>{0}<em>+{1}</em></i> '.replace('{0}', itemName).replace('{1}', key.gain['item'][itemName].toLocaleString());
                        }
                    }
                    else {
                        stat += '<i>{0}<em>+{1}</em></i> '.replace('{0}', k).replace('{1}', key.gain[k].toLocaleString());
                    }
                }
            }
            if ($.type(key.pay) === 'object' && !$.isEmptyObject(key.pay)) {
                if (!stat) stat += '，';
                for (var k in key.pay) {
                    if (k === 'item') {
                        for (var itemName in key.pay['item']) {
                            stat += '<i>{0}<ins>{1}</ins></i> '.replace('{0}', itemName).replace('{1}', key.pay['item'][itemName].toLocaleString());
                        }
                    }
                    else {
                        stat += '<i>{0}<ins>{1}</ins></i> '.replace('{0}', k).replace('{1}', key.pay[k].toLocaleString());
                    }
                }
            }

            content += stat + '</p>';
        });

        return content;
    },

    /**
     * 显示指定日期的日志统计结果
     * @param {string} date 日志对象关键字
     */
    showLogStat: function (date) {
        if ($.type(Log.log[date]) !== 'array') return;
        $('#pd_log_stat').html(Log.getLogStat(date, Config.logStatType));
    },

    /**
     * 获取指定日期的日志统计结果
     * @param {string} date 日志对象关键字
     * @param {string} logStatType 日志统计范围类型
     * @returns {string} 指定日期的日志统计结果
     */
    getLogStat: function (date, logStatType) {
        var log = {};

        if (logStatType === 'custom') {
            var dateList = Tools.getObjectKeyList(Log.log, 1);
            var minDate = new Date(date);
            minDate.setDate(minDate.getDate() - Config.logStatDays + 1);
            minDate = Tools.getDateString(minDate);
            for (var k in dateList) {
                if (dateList[k] >= minDate && dateList[k] <= date) {
                    log[dateList[k]] = Log.log[dateList[k]];
                }
            }
        }
        else if (logStatType === 'all') {
            log = Log.log;
        }
        else {
            log[date] = Log.log[date];
        }

        var income = {}, expense = {}, profit = {};
        var smBoxGain = [], lootGain = [], lootItemGain = {};
        var lootCount = 0, lootAttackedCount = 0, minLootAttackedCount = -1, maxLootAttackedCount = -1,
            lootAttackKfb = 0, minLootAttackKfb = -1, maxLootAttackKfb = -1,
            lootAttackedKfb = 0, minLootAttackedKfb = -1, maxLootAttackedKfb = -1;
        var attackCount = 0, attemptAttackCount = 0, attackKfb = 0, attackExp = 0,
            strongAttackCount = 0, minStrongAttackCount = -1, maxStrongAttackCount = -1, deadlyAttackCount = 0;
        for (var d in log) {
            $.each(log[d], function (index, key) {
                if (key.notStat || typeof key.type === 'undefined') return;
                if ($.type(key.gain) === 'object') {
                    for (var k in key.gain) {
                        if (k === 'item' || k === '夺取KFB') continue;
                        if (typeof income[k] === 'undefined') income[k] = key.gain[k];
                        else income[k] += key.gain[k];
                    }
                    if (key.type === '领取争夺奖励') {
                        if (typeof key.gain['KFB'] !== 'undefined')lootGain.push(key.gain['KFB']);

                        var matches = /`(\d+)`次攻击/.exec(key.action);
                        if (matches && $.type(key.pay) === 'object' && typeof key.gain['夺取KFB'] !== 'undefined' && typeof key.pay['夺取KFB'] !== 'undefined') {
                            lootCount++;
                            var count = parseInt(matches[1]);
                            lootAttackedCount += count;
                            if (minLootAttackedCount < 0 || count < minLootAttackedCount) minLootAttackedCount = count;
                            if (count > maxLootAttackedCount) maxLootAttackedCount = count;
                            var kfb = parseInt(key.gain['夺取KFB']);
                            lootAttackKfb += kfb;
                            if (minLootAttackKfb < 0 || kfb < minLootAttackKfb) minLootAttackKfb = kfb;
                            if (kfb > maxLootAttackKfb) maxLootAttackKfb = kfb;
                            var kfb = Math.abs(parseInt(key.pay['夺取KFB']));
                            lootAttackedKfb += kfb;
                            if (minLootAttackedKfb < 0 || kfb < minLootAttackedKfb) minLootAttackedKfb = kfb;
                            if (kfb > maxLootAttackedKfb) maxLootAttackedKfb = kfb;
                        }
                    }
                    else if ((key.type === '批量攻击' || key.type === '试探攻击')) {
                        var matches = /`(\d+)`次/.exec(key.action);
                        if (matches) {
                            if (key.type === '试探攻击') attemptAttackCount++;
                            if (typeof key.gain['夺取KFB'] !== 'undefined') attackKfb += parseInt(key.gain['夺取KFB']);
                            if (typeof key.gain['经验值'] !== 'undefined') attackExp += parseInt(key.gain['经验值']);
                            attackCount += parseInt(matches[1]);
                            matches = /暴击`\+(\d+)`/.exec(key.action);
                            if (matches) {
                                var count = parseInt(matches[1]);
                                strongAttackCount += count;
                                if (key.type === '批量攻击') {
                                    if (minStrongAttackCount < 0 || count < minStrongAttackCount) minStrongAttackCount = count;
                                    if (count > maxStrongAttackCount) maxStrongAttackCount = count;
                                }
                            }
                            matches = /致命一击`\+(\d+)`/.exec(key.action);
                            if (matches) deadlyAttackCount += parseInt(matches[1]);
                        }

                        if ($.type(key.gain['item']) === 'object') {
                            for (var itemName in key.gain['item']) {
                                var num = parseInt(key.gain['item'][itemName]);
                                if (typeof lootItemGain[itemName] === 'undefined') lootItemGain[itemName] = num;
                                else lootItemGain[itemName] += num;
                            }
                        }
                    }
                    else if (key.type === '抽取神秘盒子' && typeof key.gain['KFB'] !== 'undefined') {
                        smBoxGain.push(key.gain['KFB']);
                    }
                }
                if ($.type(key.pay) === 'object') {
                    for (var k in key.pay) {
                        if (k === 'item' || k === '夺取KFB') continue;
                        if (typeof expense[k] === 'undefined') expense[k] = key.pay[k];
                        else expense[k] += key.pay[k];
                    }
                }
            });
        }

        /**
         * 为统计项目排序
         * @param {{}} obj 统计结果列表
         * @returns {string[]} 经过排序项目列表
         */
        var sortStatItemList = function (obj) {
            var sortTypeList = ['KFB', '经验值', '能量', 'VIP小时', '贡献', '神秘', '燃烧伤害', '命中', '闪避', '暴击比例', '暴击几率',
                '防御', '道具', '已使用道具', '有效道具', '无效道具', '卡片'];
            var list = Tools.getObjectKeyList(obj, 0);
            list.sort(function (a, b) {
                return $.inArray(a, sortTypeList) > $.inArray(b, sortTypeList);
            });
            return list;
        };

        var content = '';
        content += '<strong>收获：</strong>';
        $.each(sortStatItemList(income), function (index, key) {
            profit[key] = income[key];
            content += '<i>{0}<em>+{1}</em></i> '.replace('{0}', key).replace('{1}', income[key].toLocaleString());
        });
        content += '<br /><strong>付出：</strong>';
        $.each(sortStatItemList(expense), function (index, key) {
            if (typeof profit[key] === 'undefined') profit[key] = expense[key];
            else profit[key] += expense[key];
            content += '<i>{0}<ins>{1}</ins></i> '.replace('{0}', key).replace('{1}', expense[key].toLocaleString());
        });
        content += '<br /><strong>结余：</strong>';
        $.each(sortStatItemList(profit), function (index, key) {
            content += '<i>{0}{1}</i> '.replace('{0}', key).replace('{1}', Tools.getStatFormatNumber(profit[key]));
        });

        content += '<div style="margin:5px 0;border-bottom:1px dashed #CCCCFF"></div>';
        if (Config.autoDrawSmbox2Enabled) {
            var smBoxIncome = 0, minSmBox = 0, maxSmBox = 0;
            $.each(smBoxGain, function (index, kfb) {
                smBoxIncome += kfb;
                if (index === 0) minSmBox = kfb;
                if (minSmBox > kfb) minSmBox = kfb;
                if (maxSmBox < kfb) maxSmBox = kfb;
            });
            content += ('\n<strong>神秘盒子KFB收获：</strong><i>抽取次数<em>+{0}</em></i> <i>合计<em>+{1}</em></i> <i>平均值<em>+{2}</em></i> ' +
            '<i>最小值<em>+{3}</em></i> <i>最大值<em>+{4}</em></i>')
                .replace('{0}', smBoxGain.length.toLocaleString())
                .replace('{1}', smBoxIncome.toLocaleString())
                .replace('{2}', smBoxGain.length > 0 ? Tools.getFixedNumberLocaleString(smBoxIncome / smBoxGain.length, 2) : 0)
                .replace('{3}', minSmBox.toLocaleString())
                .replace('{4}', maxSmBox.toLocaleString());
        }
        else {
            var lootIncome = 0, minLoot = 0, maxLoot = 0;
            $.each(lootGain, function (index, kfb) {
                lootIncome += kfb;
                if (index === 0) minLoot = kfb;
                if (minLoot > kfb) minLoot = kfb;
                if (maxLoot < kfb) maxLoot = kfb;
            });
            content += ('\n<strong>争夺KFB收获：</strong><i>回合数<em>+{0}</em></i> <i>合计<em>+{1}</em></i> <i>平均值<em>+{2}</em></i> ' +
            '<i>最小值<em>+{3}</em></i> <i>最大值<em>+{4}</em></i>')
                .replace('{0}', lootGain.length.toLocaleString())
                .replace('{1}', lootIncome.toLocaleString())
                .replace('{2}', lootGain.length > 0 ? Tools.getFixedNumberLocaleString(lootIncome / lootGain.length, 2) : 0)
                .replace('{3}', minLoot.toLocaleString())
                .replace('{4}', maxLoot.toLocaleString());

            if (Config.autoLootEnabled) {
                content += ('<br /><strong>争夺详情统计：</strong><i class="pd_custom_tips" title="只有连续记录的争夺回合才会被统计">回合数<em>+{0}</em></i> ' +
                '<i>被攻击次数<em>+{1}</em><span class="pd_stat_extra">(<em title="平均值">+{2}</em>|<em title="最小值">+{3}</em>|<em title="最大值">+{4}</em>)</span></i> ' +
                '<i>夺取KFB<em>+{5}</em><span class="pd_stat_extra">(<em title="平均值">+{6}</em>|<em title="最小值">+{7}</em>|<em title="最大值">+{8}</em>)</span></i> ' +
                '<i>夺取KFB<ins>-{9}</ins><span class="pd_stat_extra">(<ins title="平均值">-{10}</ins>|<ins title="最小值">-{11}</ins>|<ins title="最大值">-{12}</ins>)</span></i> ')
                    .replace('{0}', lootCount.toLocaleString())
                    .replace('{1}', lootAttackedCount.toLocaleString())
                    .replace('{2}', lootCount > 0 ? Tools.getFixedNumberLocaleString(lootAttackedCount / lootCount, 2) : 0)
                    .replace('{3}', minLootAttackedCount > 0 ? minLootAttackedCount.toLocaleString() : 0)
                    .replace('{4}', maxLootAttackedCount > 0 ? maxLootAttackedCount.toLocaleString() : 0)
                    .replace('{5}', lootAttackKfb.toLocaleString())
                    .replace('{6}', lootCount > 0 ? Tools.getFixedNumberLocaleString(lootAttackKfb / lootCount, 2) : 0)
                    .replace('{7}', minLootAttackKfb > 0 ? minLootAttackKfb.toLocaleString() : 0)
                    .replace('{8}', maxLootAttackKfb > 0 ? maxLootAttackKfb.toLocaleString() : 0)
                    .replace('{9}', lootAttackedKfb.toLocaleString())
                    .replace('{10}', lootCount > 0 ? Tools.getFixedNumberLocaleString(lootAttackedKfb / lootCount, 2) : 0)
                    .replace('{11}', minLootAttackedKfb > 0 ? minLootAttackedKfb.toLocaleString() : 0)
                    .replace('{12}', maxLootAttackedKfb > 0 ? maxLootAttackedKfb.toLocaleString() : 0);
            }

            content += ('<br /><strong>攻击详情统计：</strong>' +
            '<i>攻击次数<em>+{0}</em><span class="pd_stat_extra">(<em title="试探攻击次数">+{1}</em>)</span></i> <i>夺取KFB<em>+{2}</em></i> <i>经验值<em>+{3}</em></i> ' +
            '<i>暴击次数<em>+{4}</em><span class="pd_stat_extra">(<em title="暴击几率">{5}%</em>|<em title="最小值（批量攻击）">+{6}</em>|' +
            '<em title="最大值（批量攻击）">+{7}</em>)</span></i> <i>致命一击次数<em>+{8}</em></i>')
                .replace('{0}', attackCount.toLocaleString())
                .replace('{1}', attemptAttackCount.toLocaleString())
                .replace('{2}', attackKfb.toLocaleString())
                .replace('{3}', attackExp.toLocaleString())
                .replace('{4}', strongAttackCount.toLocaleString())
                .replace('{5}', attackCount > 0 ? (strongAttackCount / attackCount * 100).toFixed(2) : 0)
                .replace('{6}', minStrongAttackCount > 0 ? minStrongAttackCount.toLocaleString() : 0)
                .replace('{7}', maxStrongAttackCount > 0 ? maxStrongAttackCount.toLocaleString() : 0)
                .replace('{8}', deadlyAttackCount.toLocaleString());

            var lootItemGainContent = '';
            var lootItemGainKeyList = Tools.getObjectKeyList(lootItemGain, 0);
            lootItemGainKeyList.sort(function (a, b) {
                return Item.getItemLevelByItemName(a) > Item.getItemLevelByItemName(b);
            });
            var lootItemGainTotalNum = 0;
            $.each(lootItemGainKeyList, function (index, key) {
                lootItemGainTotalNum += lootItemGain[key];
                lootItemGainContent += '<i>{0}<em>+{1}</em></i> '.replace('{0}', key).replace('{1}', lootItemGain[key]);
            });
            content += '<br /><strong>争夺道具收获：</strong><i>道具<em>+{0}</em></i> {1}'.replace('{0}', lootItemGainTotalNum).replace('{1}', lootItemGainContent);
        }

        return content;
    },

    /**
     * 显示导入或导出日志对话框
     */
    showImportOrExportLogDialog: function () {
        if ($('#pd_im_or_ex_log').length > 0) return;
        Log.read();
        var html =
            '<div class="pd_cfg_main">' +
            '  <div>' +
            '    <strong>导入日志：</strong>将日志内容粘贴到文本框中并点击保存按钮即可<br />' +
            '    <strong>导出日志：</strong>复制文本框里的内容并粘贴到文本文件里即可' +
            '  </div>' +
            '  <textarea id="pd_log_setting" style="width:600px;height:200px;word-break:break-all"></textarea>' +
            '  <div style="margin-top:10px">' +
            '    <strong>导出日志文本</strong>：复制文本框里的内容并粘贴到文本文件里即可<br />' +
            '    <div>' +
            '      <label title="按时间顺序排序"><input type="radio" name="pd_log_sort_type_2" value="time" checked="checked" />按时间</label>' +
            '      <label title="按日志类别排序"><input type="radio" name="pd_log_sort_type_2" value="type" />按类别</label>' +
            '      <label title="在日志文本里显示每日以及全部数据的统计结果"><input type="checkbox" id="pd_log_show_stat" checked="checked" />显示统计</label>' +
            '    </div>' +
            '  </div>' +
            '  <textarea id="pd_log_text" style="width:600px;height:270px" readonly="readonly"></textarea>' +
            '</div>' +
            '<div class="pd_cfg_btns">' +
            '  <button>保存</button><button>取消</button>' +
            '</div>';
        var $dialog = Dialog.create('pd_im_or_ex_log', '导入或导出日志', html);
        $dialog.find('input[name="pd_log_sort_type_2"], #pd_log_show_stat').click(function () {
            Log.showLogText();
        }).end().find('.pd_cfg_btns > button:first').click(function (e) {
            e.preventDefault();
            if (!window.confirm('是否导入文本框中的日志？')) return;
            var log = $.trim($('#pd_log_setting').val());
            if (!log) return;
            try {
                log = JSON.parse(log);
            }
            catch (ex) {
                alert('日志有错误');
                return;
            }
            if (!log || $.type(log) !== 'object') {
                alert('日志有错误');
                return;
            }
            Log.log = log;
            Log.write();
            alert('日志已导入');
            location.reload();
        }).next('button').click(function () {
            return Dialog.close('pd_im_or_ex_log');
        });
        Dialog.show('pd_im_or_ex_log');
        $('#pd_log_setting').val(JSON.stringify(Log.log)).select();
        $('input[name="pd_log_sort_type_2"][value="{0}"]'.replace('{0}', Config.logSortType)).prop('checked', true).click();
    },

    /**
     * 显示日志文本
     */
    showLogText: function () {
        var logSortType = $('input[name="pd_log_sort_type_2"]:checked').val();
        var isShowStat = $('#pd_log_show_stat').prop('checked');
        var content = '', lastDate = '';
        for (var date in Log.log) {
            if ($.type(Log.log[date]) !== 'array') continue;
            if (lastDate > date) lastDate = date;
            content +=
                '【{0}】(共{1}项)\n{2}'
                    .replace('{0}', date)
                    .replace('{1}', Log.log[date].length)
                    .replace('{2}', logSortType === 'type' ? '' : '\n') +
                Log.getLogContent(date, logSortType)
                    .replace(/<h3>/g, '\n')
                    .replace(/<\/h3>/g, '\n')
                    .replace(/<\/p>/g, '\n')
                    .replace(/(<.+?>|<\/.+?>)/g, '')
                    .replace(/`/g, '');
            if (isShowStat) {
                content +=
                    '----------------------------------------------\n' +
                    '合计：\n' +
                    Log.getLogStat(date, 'cur')
                        .replace(/<br \/>/g, '\n')
                        .replace(/(<.+?>|<\/.+?>)/g, '') +
                    '\n';
            }
            content += '==============================================\n';
        }
        if (content && isShowStat) {
            content +=
                '\n总计：\n' +
                Log.getLogStat(lastDate, 'all')
                    .replace(/<br \/>/g, '\n')
                    .replace(/(<.+?>|<\/.+?>)/g, '');
        }
        $('#pd_log_text').val(content);
    }
};

/**
 * 临时日志类
 */
var TmpLog = {
    // 保存临时日志的键值名称
    name: 'pd_tmp_log',
    // 临时日志对象
    log: {},

    /**
     * 读取临时日志
     */
    read: function () {
        TmpLog.log = {};
        var log = null;
        if (storageType === 'Script' || storageType === 'Global') log = GM_getValue(TmpLog.name + '_' + KFOL.uid);
        else log = localStorage.getItem(TmpLog.name + '_' + KFOL.uid);
        if (!log) return;
        try {
            log = JSON.parse(log);
        }
        catch (ex) {
            return;
        }
        if (!log || $.type(log) !== 'object') return;
        var allowKey = [];
        for (var k in Const) {
            if (k.indexOf('TmpLogName') > -1) allowKey.push(Const[k]);
        }
        for (var k in log) {
            if ($.inArray(k, allowKey) === -1) delete log[k];
        }
        TmpLog.log = log;
    },

    /**
     * 写入临时日志
     */
    write: function () {
        if (storageType === 'Script' || storageType === 'Global') GM_setValue(TmpLog.name + '_' + KFOL.uid, JSON.stringify(TmpLog.log));
        else localStorage.setItem(TmpLog.name + '_' + KFOL.uid, JSON.stringify(TmpLog.log));
    },

    /**
     * 清除临时日志
     */
    clear: function () {
        if (storageType === 'Script' || storageType === 'Global') GM_deleteValue(TmpLog.name + '_' + KFOL.uid);
        else localStorage.removeItem(TmpLog.name + '_' + KFOL.uid);
    },

    /**
     * 获取指定名称的临时日志内容
     * @param {string} key 日志名称
     * @returns {*} 日志内容
     */
    getValue: function (key) {
        TmpLog.read();
        if (typeof TmpLog.log[key] !== 'undefined') return TmpLog.log[key];
        else return null;
    },

    /**
     * 设置指定名称的临时日志内容
     * @param {string} key 日志名称
     * @param {*} value 日志内容
     */
    setValue: function (key, value) {
        TmpLog.read();
        TmpLog.log[key] = value;
        TmpLog.write();
    },

    /**
     * 删除指定名称的临时日志
     * @param {string} key 日志名称
     */
    deleteValue: function (key) {
        TmpLog.read();
        if (typeof TmpLog.log[key] !== 'undefined') {
            delete TmpLog.log[key];
            TmpLog.write();
        }
    }
};

/**
 * 道具类
 */
var Item = {
    /**
     * 获得转换指定等级道具可获得的能量点
     * @param {number} itemLevel 道具等级
     * @returns {number} 能量点
     */
    getGainEnergyNumByItemLevel: function (itemLevel) {
        switch (itemLevel) {
            case 1:
                return 2;
            case 2:
                return 10;
            case 3:
                return 50;
            case 4:
                return 300;
            case 5:
                return 2000;
            default:
                return 0;
        }
    },

    /**
     * 获得恢复指定等级道具所需的能量点
     * @param {number} itemLevel 道具等级
     * @returns {number} 能量点
     */
    getRestoreEnergyNumByItemLevel: function (itemLevel) {
        switch (itemLevel) {
            case 1:
                return 10;
            case 2:
                return 50;
            case 3:
                return 300;
            case 4:
                return 2000;
            case 5:
                return 10000;
            default:
                return 0;
        }
    },

    /**
     * 获取指定等级道具的出售所得
     * @param {number} itemLevel 道具等级
     * @returns {number} 出售所得
     */
    getSellItemGainByItemLevel: function (itemLevel) {
        switch (itemLevel) {
            case 3:
                return 300;
            case 4:
                return 2000;
            case 5:
                return 10000;
            default:
                return 0;
        }
    },

    /**
     * 获取指定名称的道具种类ID
     * @param {string} itemName 道具名称
     * @returns {number} 道具种类ID
     */
    getItemTypeIdByItemName: function (itemName) {
        switch (itemName) {
            case '零时迷子的碎片':
                return 1;
            case '被遗弃的告白信':
                return 2;
            case '学校天台的钥匙':
                return 3;
            case 'TMA最新作压缩包':
                return 4;
            case 'LOLI的钱包':
                return 5;
            case '棒棒糖':
                return 6;
            case '蕾米莉亚同人漫画':
                return 11;
            case '十六夜同人漫画':
                return 7;
            case '档案室钥匙':
                return 8;
            case '傲娇LOLI娇蛮音CD':
                return 12;
            case '整形优惠卷':
                return 9;
            case '消逝之药':
                return 10;
            default:
                return 0;
        }
    },

    /**
     * 获取指定名称的道具等级
     * @param {string} itemName 道具名称
     * @returns {number} 道具等级
     */
    getItemLevelByItemName: function (itemName) {
        switch (itemName) {
            case '零时迷子的碎片':
            case '被遗弃的告白信':
            case '学校天台的钥匙':
            case 'TMA最新作压缩包':
                return 1;
            case 'LOLI的钱包':
            case '棒棒糖':
                return 2;
            case '蕾米莉亚同人漫画':
            case '十六夜同人漫画':
                return 3;
            case '档案室钥匙':
            case '傲娇LOLI娇蛮音CD':
                return 4;
            case '整形优惠卷':
            case '消逝之药':
                return 5;
            default:
                return 0;
        }
    },

    /**
     * 获取指定名称的道具使用上限个数
     * @param {string} itemName 道具名称
     * @returns {number} 道具的使用上限个数
     */
    getItemMaxUsedNumByItemName: function (itemName) {
        switch (itemName) {
            case '蕾米莉亚同人漫画':
            case '十六夜同人漫画':
                return 50;
            case '档案室钥匙':
            case '傲娇LOLI娇蛮音CD':
                return 30;
            case '整形优惠卷':
            case '消逝之药':
                return 10;
            default:
                return -1;
        }
    },

    /**
     * 从使用道具的回应消息中获取积分数据
     * @param {string} response 使用道具的回应消息
     * @param {number} itemTypeId 道具种类ID
     * @returns {Object|number} 积分对象，-1表示使用失败
     */
    getCreditsViaResponse: function (response, itemTypeId) {
        if (/(错误的物品编号|无法再使用|该道具已经被使用)/.test(response)) {
            return -1;
        }
        if (itemTypeId >= 7 && itemTypeId <= 12) {
            if (/成功！/.test(response)) {
                switch (itemTypeId) {
                    case 11:
                        return {'燃烧伤害': 1};
                    case 7:
                        return {'命中': 3, '闪避': 1};
                    case 8:
                        return {'暴击比例': 10};
                    case 12:
                        return {'命中': 1, '闪避': 3};
                    case 9:
                        return {'暴击几率': 3};
                    case 10:
                        return {'防御': 7};
                }
            }
        }
        else {
            var matches = null;
            matches = /恢复能量增加了\s*(\d+)\s*点/i.exec(response);
            if (matches) return {'能量': parseInt(matches[1])};
            matches = /(\d+)KFB/i.exec(response);
            if (matches) return {'KFB': parseInt(matches[1])};
            matches = /(\d+)点?贡献/i.exec(response);
            if (matches) return {'贡献': parseInt(matches[1])};
            matches = /贡献\+(\d+)/i.exec(response);
            if (matches) return {'贡献': parseInt(matches[1])};
        }
        return {};
    },

    /**
     * 获取本种类指定数量的道具ID列表
     * @param {string} html 道具列表页面的HTML代码
     * @param {number} [num] 指定道具数量（留空表示获取当前所有道具）
     * @returns {number[]} 道具ID列表
     */
    getItemIdList: function (html, num) {
        var itemIdList = [];
        var matches = html.match(/kf_fw_ig_my\.php\?pro=\d+/gi);
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                if (num && i + 1 > num) break;
                var itemIdMatches = /pro=(\d+)/i.exec(matches[i]);
                if (itemIdMatches) itemIdList.push(parseInt(itemIdMatches[1]));
            }
        }
        return itemIdList;
    },

    /**
     * 使用指定的一系列道具
     * @param {{}} options 设置项
     * @param {number} options.type 使用类型，1：使用本种类指定数量的道具；2：使用本种类指定ID的道具
     * @param {number[]} options.itemIdList 指定的道具ID列表
     * @param {string} options.safeId 用户的SafeID
     * @param {number} options.itemLevel 道具等级
     * @param {number} options.itemTypeId 道具种类ID
     * @param {string} options.itemName 道具名称
     * @param {jQuery} [options.$itemLine] 当前使用道具种类所在的表格行（用于使用类型1）
     * @param {{}} [cycle] 循环使用道具的信息类
     * @param {number} cycle.itemNum 循环使用的道具数量
     * @param {number} cycle.round 当前循环的轮数
     * @param {number} cycle.totalEnergyNum 当前的道具恢复能量
     * @param {{}} cycle.countStat 循环使用道具的操作次数统计项
     * @param {{}} cycle.stat 循环使用道具的统计项
     * @param {number} cycle.maxUseItemRound 使用道具轮数上限（0表示不限制）
     * @param {number} cycle.maxSuccessRestoreItemCount 恢复道具成功次数上限（0表示不限制）
     */
    useItems: function (options, cycle) {
        var settings = {
            type: 1,
            itemIdList: [],
            safeId: '',
            itemLevel: 0,
            itemTypeId: 0,
            itemName: '',
            $itemLine: null
        };
        $.extend(settings, options);

        if (cycle) {
            if (cycle.round === 1) {
                console.log('循环使用道具Start，使用道具数量：{0}，使用道具轮数上限：{1}，恢复道具成功次数上限：{2}'
                    .replace('{0}', cycle.itemNum)
                    .replace('{1}', cycle.maxUseItemRound ? cycle.maxUseItemRound : '无限制')
                    .replace('{2}', cycle.maxSuccessRestoreItemCount ? cycle.maxSuccessRestoreItemCount : '无限制')
                );
                $('.kf_fw_ig1:last').parent().append(
                    ('<ul class="pd_result"><li class="pd_stat"><strong>对<em>{0}</em>个【Lv.{1}：{2}】道具的循环使用开始（当前道具恢复能量<em>{3}</em>点）<br />' +
                    '（使用道具轮数上限：<em>{4}</em>，恢复道具成功次数上限：<em>{5}</em>）</strong></li></ul>')
                        .replace('{0}', cycle.itemNum)
                        .replace('{1}', settings.itemLevel)
                        .replace('{2}', settings.itemName)
                        .replace('{3}', cycle.totalEnergyNum)
                        .replace('{4}', cycle.maxUseItemRound ? cycle.maxUseItemRound : '无限制')
                        .replace('{5}', cycle.maxSuccessRestoreItemCount ? cycle.maxSuccessRestoreItemCount : '无限制')
                );
            }
            else {
                $('.pd_result:last').append('<div class="pd_result_sep"></div>');
            }
            $('.pd_result:last').append('<li class="pd_stat" style="color:#FF3399"><strong>第{0}轮循环开始：</strong></li>'.replace('{0}', cycle.round));
        }
        if (cycle) {
            $('.pd_result:last').append('<li><strong>使用结果：</strong></li>');
        }
        else {
            $('.kf_fw_ig1:last').parent().append(
                '<ul class="pd_result"><li><strong>【Lv.{0}：{1}】使用结果：</strong></li></ul>'
                    .replace('{0}', settings.itemLevel)
                    .replace('{1}', settings.itemName)
            );
        }

        var successNum = 0, failNum = 0;
        var responseMsg = '';
        var nextRoundItemIdList = [];
        $(document).clearQueue('UseItems');
        $.each(settings.itemIdList, function (index, itemId) {
            $(document).queue('UseItems', function () {
                $.ajax({
                    type: 'GET',
                    url: 'kf_fw_ig_doit.php?id={0}&t={1}'.replace('{0}', itemId).replace('{1}', new Date().getTime()),
                    success: function (html) {
                        KFOL.showFormatLog('使用道具', html);
                        var matches = /<span style=".+?">(.+?)<\/span><br \/><a href=".+?">/i.exec(html);
                        if (matches && !/(错误的物品编号|无法再使用|该道具已经被使用)/.test(html)) {
                            successNum++;
                            responseMsg += matches[1] + '\n';
                            nextRoundItemIdList.push(itemId);
                        }
                        else {
                            failNum++;
                            if (/无法再使用/.test(html)) nextRoundItemIdList = [];
                        }
                        $('.pd_result:last').append('<li><b>第{0}次：</b>{1}</li>'
                            .replace('{0}', index + 1)
                            .replace('{1}', matches ? matches[1] : '未能获得预期的回应')
                        );
                    },
                    error: function () {
                        failNum++;
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('UseItems');

                        if (isStop || index === settings.itemIdList.length - 1) {
                            KFOL.removePopTips($remainingNum.closest('.pd_pop_tips'));
                            var stat = {'有效道具': 0, '无效道具': 0};
                            $.each(responseMsg.split('\n'), function (i, text) {
                                if (!text) return;
                                var credits = Item.getCreditsViaResponse(text, settings.itemTypeId);
                                if (credits !== -1) {
                                    if ($.isEmptyObject(credits)) stat['无效道具']++;
                                    else stat['有效道具']++;
                                    $.each(credits, function (key, credit) {
                                        if (typeof stat[key] === 'undefined')
                                            stat[key] = credit;
                                        else
                                            stat[key] += credit;
                                    });
                                }
                            });
                            if (stat['有效道具'] === 0) delete stat['有效道具'];
                            if (stat['无效道具'] === 0) delete stat['无效道具'];
                            if (!cycle && successNum > 0) {
                                Log.push('使用道具',
                                    '共有`{0}`个【`Lv.{1}：{2}`】道具被使用'
                                        .replace('{0}', successNum)
                                        .replace('{1}', settings.itemLevel)
                                        .replace('{2}', settings.itemName),
                                    {
                                        gain: $.extend({}, stat, {'已使用道具': successNum}),
                                        pay: {'道具': -successNum}
                                    }
                                );
                            }
                            var logStat = '', msgStat = '', resultStat = '';
                            for (var creditsType in stat) {
                                logStat += '，{0}+{1}'
                                    .replace('{0}', creditsType)
                                    .replace('{1}', stat[creditsType]);
                                msgStat += '<i>{0}<em>+{1}</em></i>'
                                    .replace('{0}', creditsType)
                                    .replace('{1}', stat[creditsType]);
                                resultStat += '<i>{0}<em>+{1}</em></i> '
                                    .replace('{0}', creditsType)
                                    .replace('{1}', stat[creditsType]);
                                if (cycle) {
                                    if (typeof cycle.stat[creditsType] === 'undefined') cycle.stat[creditsType] = stat[creditsType];
                                    else cycle.stat[creditsType] += stat[creditsType];
                                }
                            }
                            console.log('共有{0}个道具被使用{1}{2}'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有{0}个道具未能使用'.replace('{0}', failNum) : '')
                                .replace('{2}', logStat)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>个道具被使用{1}</strong>{2}'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>个道具未能使用'.replace('{0}', failNum) : '')
                                .replace('{2}', msgStat)
                                , -1);
                            if (resultStat === '') resultStat = '<span class="pd_notice">无</span>';
                            $('.pd_result:last').append(
                                '<li class="pd_stat"><b>统计结果（共有<em>{0}</em>个道具被使用）：</b><br />{1}</li>'
                                    .replace('{0}', successNum)
                                    .replace('{1}', resultStat)
                            );

                            if (settings.type === 2) {
                                $('.kf_fw_ig1 input[type="checkbox"]:checked')
                                    .closest('tr')
                                    .fadeOut('normal', function () {
                                        $(this).remove();
                                    });
                            }
                            else {
                                Item.setCurrentItemUsableAndUsedNum(settings.$itemLine, successNum, -successNum);
                                Item.showItemUsedInfo(settings.$itemLine.closest('tbody').find('tr:gt(1) > td:nth-child(2) > a'));
                            }
                            if (settings.itemName === '零时迷子的碎片') Item.showCurrentUsedItemNum();

                            if (cycle) {
                                settings.itemIdList = nextRoundItemIdList;
                                if (settings.itemIdList.length === 0) isStop = true;
                                cycle.countStat['被使用次数'] += successNum;
                                cycle.stat['道具'] -= successNum;
                                cycle.stat['已使用道具'] += successNum;
                                Item.cycleUseItems(isStop ? 0 : 2, settings, cycle);
                            }
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('UseItems');
                            }, typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        $(document).dequeue('UseItems');
    },

    /**
     * 恢复指定的一系列道具
     * @param {{}} options 设置项
     * @param {number} options.type 恢复类型，1：恢复本种类指定数量的道具；2：恢复本种类指定ID的道具
     * @param {number[]} options.itemIdList 指定的道具ID列表
     * @param {string} options.safeId 用户的SafeID
     * @param {number} options.itemLevel 道具等级
     * @param {number} options.itemTypeId 道具种类ID
     * @param {string} options.itemName 道具名称
     * @param {jQuery} [options.$itemLine] 当前恢复道具种类所在的表格行（用于恢复类型1）
     * @param {{}} [cycle] 循环使用道具的信息类
     * @param {number} cycle.itemNum 循环使用的道具数量
     * @param {number} cycle.round 当前循环的轮数
     * @param {number} cycle.totalEnergyNum 当前的道具恢复能量
     * @param {{}} cycle.countStat 循环使用道具的操作次数统计项
     * @param {{}} cycle.stat 循环使用道具的统计项
     * @param {number} cycle.maxUseItemRound 使用道具轮数上限（0表示不限制）
     * @param {number} cycle.maxSuccessRestoreItemCount 恢复道具成功次数上限（0表示不限制）
     */
    restoreItems: function (options, cycle) {
        var settings = {
            type: 1,
            itemIdList: [],
            safeId: '',
            itemLevel: 0,
            itemTypeId: 0,
            itemName: '',
            $itemLine: null
        };
        $.extend(settings, options);

        if (cycle) {
            $('.pd_result:last').append('<li class="pd_result_sep_inner"></li><li><strong>恢复结果：</strong></li>');
        }
        else {
            $('.kf_fw_ig1:last').parent().append(
                '<ul class="pd_result"><li><strong>【Lv.{0}：{1}】恢复结果：</strong></li></ul>'
                    .replace('{0}', settings.itemLevel)
                    .replace('{1}', settings.itemName)
            );
        }

        var successNum = 0, failNum = 0, successEnergyNum = 0;
        var perEnergyNum = Item.getRestoreEnergyNumByItemLevel(settings.itemLevel);
        var isStop = false;
        var nextRoundItemIdList = [];
        $(document).clearQueue('RestoreItems');
        $.each(settings.itemIdList, function (index, itemId) {
            $(document).queue('RestoreItems', function () {
                $.ajax({
                    type: 'GET',
                    url: 'kf_fw_ig_doit.php?renew={0}&id={1}&t={2}'.replace('{0}', settings.safeId).replace('{1}', itemId).replace('{2}', new Date().getTime()),
                    success: function (html) {
                        KFOL.showFormatLog('恢复道具', html);
                        var msg = '';
                        var matches = /<span style=".+?">(.+?)<\/span><br \/><a href=".+?">/i.exec(html);
                        if (matches) {
                            if (/该道具已经被恢复/.test(html)) {
                                msg = '该道具已经被恢复';
                                successNum++;
                                successEnergyNum += perEnergyNum;
                                nextRoundItemIdList.push(itemId);
                                if (cycle && cycle.maxSuccessRestoreItemCount && cycle.countStat['恢复成功次数'] + successNum >= cycle.maxSuccessRestoreItemCount) {
                                    isStop = true;
                                    msg += '<span class="pd_notice">（恢复道具成功次数已达到设定上限，恢复操作中止）</span>';
                                }
                            }
                            else if (/恢复失败/.test(html)) {
                                msg = '该道具恢复失败';
                                failNum++;
                            }
                            else if (/你的能量不足以恢复本道具/.test(html)) {
                                isStop = true;
                                msg = '你的能量不足以恢复本道具<span class="pd_notice">（恢复操作中止）</span>';
                            }
                            else {
                                msg = matches[1];
                            }
                        }
                        else {
                            msg = '未能获得预期的回应';
                        }
                        $('.pd_result:last').append('<li><b>第{0}次：</b>{1}</li>'
                            .replace('{0}', index + 1)
                            .replace('{1}', msg)
                        );
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        isStop = isStop || $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('RestoreItems');

                        if (isStop || index === settings.itemIdList.length - 1) {
                            KFOL.removePopTips($remainingNum.closest('.pd_pop_tips'));
                            if (!cycle && (successNum > 0 || failNum > 0)) {
                                Log.push('恢复道具',
                                    '共有`{0}`个【`Lv.{1}：{2}`】道具恢复成功，共有`{3}`个道具恢复失败'
                                        .replace('{0}', successNum)
                                        .replace('{1}', settings.itemLevel)
                                        .replace('{2}', settings.itemName)
                                        .replace('{3}', failNum),
                                    {
                                        gain: {'道具': successNum},
                                        pay: {'已使用道具': -(successNum + failNum), '能量': -successEnergyNum}
                                    }
                                );
                            }
                            console.log('共有{0}个道具恢复成功，共有{1}个道具恢复失败，能量-{2}'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum)
                                .replace('{2}', successEnergyNum)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>个道具恢复成功，共有<em>{1}</em>个道具恢复失败</strong><i>能量<ins>-{2}</ins></i>'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum)
                                .replace('{2}', successEnergyNum)
                                , -1);
                            $('.pd_result:last').append(
                                '<li class="pd_stat">共有<em>{0}</em>个道具恢复成功，共有<em>{1}</em>个道具恢复失败，<i>能量<ins>-{2}</ins></i></li>'
                                    .replace('{0}', successNum)
                                    .replace('{1}', failNum)
                                    .replace('{2}', successEnergyNum)
                            );

                            if (settings.type === 2) {
                                $('.kf_fw_ig1:eq(1) input[type="checkbox"]:checked')
                                    .closest('tr')
                                    .fadeOut('normal', function () {
                                        $(this).remove();
                                    });
                            }
                            Item.setCurrentItemUsableAndUsedNum(settings.$itemLine, -(successNum + failNum), successNum, -successEnergyNum);

                            if (cycle) {
                                settings.itemIdList = nextRoundItemIdList;
                                if (settings.itemIdList.length === 0) isStop = true;
                                if (!isStop) cycle.round++;
                                cycle.totalEnergyNum -= successEnergyNum;
                                cycle.countStat['恢复成功次数'] += successNum;
                                cycle.countStat['恢复失败次数'] += failNum;
                                cycle.stat['能量'] -= successEnergyNum;
                                cycle.stat['道具'] += successNum;
                                cycle.stat['已使用道具'] -= successNum + failNum;
                                Item.cycleUseItems(isStop ? 0 : 1, settings, cycle);
                            }
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('RestoreItems');
                            }, typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        $(document).dequeue('RestoreItems');
    },

    /**
     * 循环使用指定的一系列道具
     * @param {number} type 操作类型，1：批量使用道具；2：批量恢复道具；0：中止循环
     * @param {{}} options 设置项
     * @param {number} options.type 循环使用类型，1：循环使用本种类指定数量的道具；2：循环使用本种类指定ID的道具
     * @param {number[]} options.itemIdList 指定的道具ID列表
     * @param {string} options.safeId 用户的SafeID
     * @param {number} options.itemLevel 道具等级
     * @param {number} options.itemTypeId 道具种类ID
     * @param {string} options.itemName 道具名称
     * @param {jQuery} [options.$itemLine] 当前使用道具种类所在的表格行（用于循环使用类型1）
     * @param {{}} cycle 循环使用道具的信息类
     * @param {number} cycle.itemNum 循环使用的道具数量
     * @param {number} cycle.round 当前循环的轮数
     * @param {number} cycle.totalEnergyNum 当前的道具恢复能量
     * @param {{}} cycle.countStat 循环使用道具的操作次数统计项
     * @param {{}} cycle.stat 循环使用道具的统计项
     * @param {number} cycle.maxUseItemRound 使用道具轮数上限（0表示不限制）
     * @param {number} cycle.maxSuccessRestoreItemCount 恢复道具成功次数上限（0表示不限制）
     */
    cycleUseItems: function (type, options, cycle) {
        if (!cycle.countStat || $.isEmptyObject(cycle.countStat)) {
            cycle.countStat = {
                '被使用次数': 0,
                '恢复成功次数': 0,
                '恢复失败次数': 0
            };
        }
        if (!cycle.stat || $.isEmptyObject(cycle.stat)) {
            cycle.stat = {
                '能量': 0,
                '道具': 0,
                '已使用道具': 0,
                '有效道具': 0,
                '无效道具': 0
            };
        }

        if ($('.pd_pop_tips').length >= 5) {
            KFOL.removePopTips($('.pd_pop_tips:first'));
        }
        if (cycle.maxUseItemRound && type === 2 && cycle.round >= cycle.maxUseItemRound) {
            type = 0;
            console.log('使用道具轮数到达设定上限，循环使用操作停止');
            $('.pd_result:last').append('<li><span class="pd_notice">（使用道具轮数到达设定上限，循环操作中止）</span></li>');
        }

        var showResult = function (type, stat) {
            var resultStat = '';
            for (var key in stat) {
                if (type > 0 && (key === '道具' || key === '已使用道具')) continue;
                resultStat += '<i>{0}{1}</i> '.replace('{0}', key).replace('{1}', Tools.getStatFormatNumber(cycle.stat[key]));
            }
            $('.pd_result:last').append(
                ('<li class="pd_result_sep{0}"></li>' +
                '<li class="pd_stat"><strong>{1}（当前道具恢复能量<em>{2}</em>点）：</strong></li>' +
                '<li class="pd_stat">{3}<i>被使用次数<em>+{4}</em></i> <i>恢复成功次数<em>+{5}</em></i> <i>恢复失败次数<em>+{6}</em></i></li>' +
                '<li class="pd_stat">{7}</li>')
                    .replace('{0}', type > 0 ? '_inner' : '')
                    .replace('{1}', type > 0 ? '截至目前为止的统计' :
                        '【Lv.{0}：{1}】循环使用最终统计'.replace('{0}', options.itemLevel).replace('{1}', options.itemName)
                    )
                    .replace('{2}', cycle.totalEnergyNum)
                    .replace('{3}', type > 0 ? '' :
                        '共进行了<em>{0}</em>轮循环：'.replace('{0}', cycle.round)
                    )
                    .replace('{4}', cycle.countStat['被使用次数'])
                    .replace('{5}', cycle.countStat['恢复成功次数'])
                    .replace('{6}', cycle.countStat['恢复失败次数'])
                    .replace('{7}', resultStat)
            );
        };

        if (type === 1) {
            showResult(type, cycle.stat);
            KFOL.showWaitMsg('<strong>正在使用道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                .replace('{0}', options.itemIdList.length)
                , true);
            window.setTimeout(function () {
                Item.useItems(options, cycle);
            }, cycle.round === 1 ? 500 : typeof Const.cycleUseItemsFirstAjaxInterval === 'function' ? Const.cycleUseItemsFirstAjaxInterval() : Const.cycleUseItemsFirstAjaxInterval);
        }
        else if (type === 2) {
            KFOL.showWaitMsg('<strong>正在恢复道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                .replace('{0}', options.itemIdList.length)
                , true);
            window.setTimeout(function () {
                Item.restoreItems(options, cycle);
            }, typeof Const.cycleUseItemsFirstAjaxInterval === 'function' ? Const.cycleUseItemsFirstAjaxInterval() : Const.cycleUseItemsFirstAjaxInterval);
        }
        else {
            if (cycle.stat['道具'] === 0) delete cycle.stat['道具'];
            if (cycle.stat['已使用道具'] === 0) delete cycle.stat['已使用道具'];
            if (cycle.stat['有效道具'] === 0) delete cycle.stat['有效道具'];
            if (cycle.stat['无效道具'] === 0) delete cycle.stat['无效道具'];
            var gain = {}, pay = {};
            for (var key in cycle.stat) {
                if (cycle.stat[key] > 0) gain[key] = cycle.stat[key];
                else pay[key] = cycle.stat[key];
            }

            if (cycle.countStat['被使用次数'] > 0) {
                Log.push('循环使用道具',
                    '对`{0}`个【`Lv.{1}：{2}`】道具进行了`{3}`轮循环使用(被使用次数`+{4}`，恢复成功次数`+{5}`，恢复失败次数`+{6}`)'
                        .replace('{0}', cycle.itemNum)
                        .replace('{1}', options.itemLevel)
                        .replace('{2}', options.itemName)
                        .replace('{3}', cycle.round)
                        .replace('{4}', cycle.countStat['被使用次数'])
                        .replace('{5}', cycle.countStat['恢复成功次数'])
                        .replace('{6}', cycle.countStat['恢复失败次数']),
                    {gain: gain, pay: pay}
                );
            }

            console.log('共进行了{0}轮循环，被使用次数+{1}，恢复成功次数+{2}，恢复失败次数+{3}，能量{4}'
                .replace('{0}', cycle.round)
                .replace('{1}', cycle.countStat['被使用次数'])
                .replace('{2}', cycle.countStat['恢复成功次数'])
                .replace('{3}', cycle.countStat['恢复失败次数'])
                .replace('{4}', cycle.stat['能量'])
            );
            var $tips = KFOL.showMsg(
                ('<strong>共进行了<em>{0}</em>轮循环</strong><i>被使用次数<em>+{1}</em></i><i>恢复成功次数<em>+{2}</em></i>' +
                '<i>恢复失败次数<em>+{3}</em></i><i>能量<ins>{4}</ins></i><a href="#">清除消息框</a>')
                    .replace('{0}', cycle.round)
                    .replace('{1}', cycle.countStat['被使用次数'])
                    .replace('{2}', cycle.countStat['恢复成功次数'])
                    .replace('{3}', cycle.countStat['恢复失败次数'])
                    .replace('{4}', cycle.stat['能量'])
                , -1);
            $tips.find('a').click(function (e) {
                e.preventDefault();
                KFOL.removePopTips($('.pd_pop_tips'));
            });
            showResult(type, cycle.stat);
        }
    },

    /**
     * 转换指定的一系列道具为能量
     * @param {{}} options 设置项
     * @param {number} options.type 转换类型，1：转换本种类指定数量的道具为能量；2：转换本种类指定ID的道具为能量
     * @param {number[]} options.itemIdList 指定的道具ID列表
     * @param {string} options.safeId 用户的SafeID
     * @param {number} options.itemLevel 道具等级
     * @param {string} options.itemName 道具名称
     * @param {jQuery} [options.$itemLine] 当前恢复道具种类所在的表格行（用于转换类型1）
     */
    convertItemsToEnergy: function (options) {
        var settings = {
            type: 1,
            itemIdList: [],
            safeId: '',
            itemLevel: 0,
            itemName: ''
        };
        $.extend(settings, options);
        $('.kf_fw_ig1:last').parent().append(
            '<ul class="pd_result"><li><strong>【Lv.{0}：{1}】转换结果：</strong></li></ul>'
                .replace('{0}', settings.itemLevel)
                .replace('{1}', settings.itemName)
        );

        var successNum = 0;
        var energyNum = Item.getGainEnergyNumByItemLevel(settings.itemLevel);
        $(document).clearQueue('ConvertItemsToEnergy');
        $.each(settings.itemIdList, function (index, itemId) {
            $(document).queue('ConvertItemsToEnergy', function () {
                $.ajax({
                    type: 'GET',
                    url: 'kf_fw_ig_doit.php?tomp={0}&id={1}&t={2}'.replace('{0}', settings.safeId).replace('{1}', itemId).replace('{2}', new Date().getTime()),
                    success: function (html) {
                        KFOL.showFormatLog('将道具转换为能量', html);
                        if (/转换为了\s*\d+\s*点能量/i.test(html)) {
                            successNum++;
                        }
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('ConvertItemsToEnergy');

                        if (isStop || index === settings.itemIdList.length - 1) {
                            KFOL.removePopTips($remainingNum.closest('.pd_pop_tips'));
                            var successEnergyNum = successNum * energyNum;
                            if (successNum > 0) {
                                Log.push('将道具转换为能量',
                                    '共有`{0}`个【`Lv.{1}：{2}`】道具成功转换为能量'
                                        .replace('{0}', successNum)
                                        .replace('{1}', settings.itemLevel)
                                        .replace('{2}', settings.itemName),
                                    {gain: {'能量': successEnergyNum}, pay: {'已使用道具': -successNum}}
                                );
                            }
                            console.log('共有{0}个道具成功转换为能量，能量+{1}'
                                .replace('{0}', successNum)
                                .replace('{1}', successEnergyNum)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>个道具成功转换为能量</strong><i>能量<em>+{1}</em></i>'
                                .replace('{0}', successNum)
                                .replace('{1}', successEnergyNum)
                                , -1);
                            $('.pd_result:last').append(
                                '<li class="pd_stat">共有<em>{0}</em>个道具成功转换为能量，<i>能量<em>+{1}</em></i></li>'
                                    .replace('{0}', successNum)
                                    .replace('{1}', successEnergyNum)
                            );

                            if (settings.type === 2) {
                                $('.kf_fw_ig1:eq(1) input[type="checkbox"]:checked')
                                    .closest('tr')
                                    .fadeOut('normal', function () {
                                        $(this).remove();
                                    });
                            }
                            Item.setCurrentItemUsableAndUsedNum(settings.$itemLine, -successNum, null, successEnergyNum);
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('ConvertItemsToEnergy');
                            }, Const.defAjaxInterval);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        $(document).dequeue('ConvertItemsToEnergy');
    },

    /**
     * 出售指定的一系列道具
     * @param {{}} options 设置项
     * @param {number[]} options.itemIdList 指定的道具ID列表
     * @param {string} options.safeId 用户的SafeID
     * @param {number} options.itemLevel 道具等级
     * @param {string} options.itemName 道具名称
     */
    sellItems: function (options) {
        var settings = {
            itemIdList: [],
            itemLevel: 0,
            itemName: ''
        };
        $.extend(settings, options);
        $('.kf_fw_ig1:last').parent().append(
            '<ul class="pd_result"><li><strong>【Lv.{0}：{1}】出售结果：</strong></li></ul>'
                .replace('{0}', settings.itemLevel)
                .replace('{1}', settings.itemName)
        );

        var successNum = 0, failNum = 0, totalGain = 0;
        $(document).clearQueue('SellItems');
        $.each(settings.itemIdList, function (index, itemId) {
            $(document).queue('SellItems', function () {
                $.ajax({
                    type: 'GET',
                    url: 'kf_fw_ig_shop.php?sell=yes&id={0}&t={1}'.replace('{0}', itemId).replace('{1}', new Date().getTime()),
                    success: function (html) {
                        KFOL.showFormatLog('出售道具', html);
                        if (/出售成功/.test(html)) {
                            successNum++;
                            totalGain += Item.getSellItemGainByItemLevel(settings.itemLevel);
                        }
                        else failNum++;
                    },
                    error: function () {
                        failNum++;
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('SellItems');

                        if (isStop || index === settings.itemIdList.length - 1) {
                            KFOL.removePopTips($remainingNum.closest('.pd_pop_tips'));
                            if (successNum > 0) {
                                Log.push('出售道具',
                                    '共有`{0}`个【`Lv.{1}：{2}`】道具出售成功'
                                        .replace('{0}', successNum)
                                        .replace('{1}', settings.itemLevel)
                                        .replace('{2}', settings.itemName),
                                    {
                                        gain: {'KFB': totalGain},
                                        pay: {'道具': -successNum}
                                    }
                                );
                            }
                            $('.kf_fw_ig1 input[type="checkbox"]:checked')
                                .closest('tr')
                                .fadeOut('normal', function () {
                                    $(this).remove();
                                });
                            console.log('共有{0}个道具出售成功，共有{1}个道具出售失败，KFB+{2}'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum)
                                .replace('{2}', totalGain)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>个道具出售成功{1}</strong><i>KFB<em>+{2}</em></i>'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>个道具出售失败'.replace('{0}', failNum) : '')
                                .replace('{2}', totalGain)
                                , -1);
                            $('.pd_result:last').append(
                                '<li class="pd_stat">共有<em>{0}</em>个道具出售成功{1}，<i>KFB<em>+{2}</em></i></li>'
                                    .replace('{0}', successNum)
                                    .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>个道具出售失败'.replace('{0}', failNum) : '')
                                    .replace('{2}', totalGain)
                            );
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('SellItems');
                            }, Const.defAjaxInterval);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        $(document).dequeue('SellItems');
    },

    /**
     * 在道具列表页面上添加批量出售和使用道具的按钮
     */
    addSellAndUseItemsButton: function () {
        var safeId = KFOL.getSafeId();
        if (!safeId) return;
        var $lastLine = $('.kf_fw_ig1 > tbody > tr:last-child');
        var itemName = $lastLine.find('td:first-child').text();
        if (!itemName) return;
        var matches = /(\d+)级道具/.exec($lastLine.find('td:nth-child(2)').text());
        if (!matches) return;
        var itemLevel = parseInt(matches[1]);
        var itemTypeId = parseInt(Tools.getUrlParam('lv'));
        if (!itemTypeId) return;
        $('.kf_fw_ig1 > tbody > tr > td:last-child').each(function () {
            var matches = /kf_fw_ig_my\.php\?pro=(\d+)/.exec($(this).find('a').attr('href'));
            if (!matches) return;
            $(this).css('width', '163')
                .parent()
                .append('<td style="width:20px;padding-right:5px"><input class="pd_input" type="checkbox" value="{0}" /></td>'
                    .replace('{0}', matches[1])
                );
        });
        $('.kf_fw_ig1 > tbody > tr:lt(2)').find('td').attr('colspan', 5);
        $('<div class="pd_item_btns"><button title="批量使用指定道具">使用道具</button><button>全选</button><button>反选</button></div>')
            .insertAfter('.kf_fw_ig1')
            .find('button:first-child')
            .click(function () {
                KFOL.removePopTips($('.pd_pop_tips'));
                var itemIdList = [];
                $('.kf_fw_ig1 input[type="checkbox"]:checked').each(function () {
                    itemIdList.push(parseInt($(this).val()));
                });
                if (itemIdList.length === 0) return;
                if (!window.confirm('共选择了{0}个道具，是否批量使用道具？'.replace('{0}', itemIdList.length))) return;
                KFOL.showWaitMsg('<strong>正在使用道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                    .replace('{0}', itemIdList.length)
                    , true);
                Item.useItems({
                    type: 2,
                    itemIdList: itemIdList,
                    safeId: safeId,
                    itemLevel: itemLevel,
                    itemTypeId: itemTypeId,
                    itemName: itemName
                });
            })
            .next()
            .click(function () {
                $('.kf_fw_ig1 input[type="checkbox"]').prop('checked', true);
            })
            .next()
            .click(function () {
                $('.kf_fw_ig1 input[type="checkbox"]').each(function () {
                    $(this).prop('checked', !$(this).prop('checked'));
                });
            });
        if (itemTypeId > 1) {
            $('<button style="color:#00F" title="循环使用和恢复指定数量的道具，直至停止操作或没有道具可以恢复">循环使用</button>').prependTo('.pd_item_btns').click(function () {
                KFOL.removePopTips($('.pd_pop_tips'));
                var itemIdList = [];
                $('.kf_fw_ig1 input[type="checkbox"]:checked').each(function () {
                    itemIdList.push(parseInt($(this).val()));
                });
                if (itemIdList.length === 0) return;
                var value = window.prompt(
                    '你要循环使用多少个道具？\n（可直接填写道具数量，也可使用“道具数量|使用道具轮数上限|恢复道具成功次数上限”的格式[上限设为0表示不限制]，例一：7；例二：5|3；例三：3|0|6）'
                    , itemIdList.length);
                if (value === null) return;
                value = $.trim(value);
                if (!/\d+(\|\d+)?(\|\d+)?/.test(value)) {
                    alert('格式不正确');
                    return;
                }
                var arr = value.split('|');
                var num = 0, maxUseItemRound = 0, maxSuccessRestoreItemCount = 0;
                num = parseInt(arr[0]);
                if (!num) return;
                if (typeof arr[1] !== 'undefined') maxUseItemRound = parseInt(arr[1]);
                if (typeof arr[2] !== 'undefined') maxSuccessRestoreItemCount = parseInt(arr[2]);
                KFOL.removePopTips($('.pd_pop_tips'));

                if (num > itemIdList.length) num = itemIdList.length;
                var tmpItemIdList = [];
                for (var i = 0; i < num; i++) {
                    tmpItemIdList.push(itemIdList[i]);
                }
                itemIdList = tmpItemIdList;
                KFOL.showWaitMsg('正在获取当前道具相关信息，请稍后...', true);
                $.get('kf_fw_ig_renew.php?t=' + new Date().getTime(), function (html) {
                    KFOL.removePopTips($('.pd_pop_tips'));
                    var totalEnergyNum = Item.getCurrentEnergyNum(html);
                    Item.showCurrentUsedItemNum(html);
                    Item.cycleUseItems(1, {
                        type: 2,
                        itemIdList: itemIdList,
                        safeId: safeId,
                        itemLevel: itemLevel,
                        itemTypeId: itemTypeId,
                        itemName: itemName
                    }, {
                        itemNum: itemIdList.length,
                        round: 1,
                        totalEnergyNum: totalEnergyNum,
                        countStat: {},
                        stat: {},
                        maxUseItemRound: maxUseItemRound,
                        maxSuccessRestoreItemCount: maxSuccessRestoreItemCount
                    });
                }, 'html');
            });
        }
        if (itemTypeId >= 7 && itemTypeId <= 12) {
            $('<button style="color:#F00" title="批量出售指定道具">出售道具</button>').prependTo('.pd_item_btns').click(function () {
                KFOL.removePopTips($('.pd_pop_tips'));
                var itemIdList = [];
                $('.kf_fw_ig1 input[type="checkbox"]:checked').each(function () {
                    itemIdList.push(parseInt($(this).val()));
                });
                if (itemIdList.length === 0) return;
                if (!window.confirm('共选择了{0}个道具，是否批量出售道具？'.replace('{0}', itemIdList.length))) return;
                KFOL.showWaitMsg('<strong>正在出售道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                    .replace('{0}', itemIdList.length)
                    , true);
                Item.sellItems({
                    itemIdList: itemIdList,
                    itemLevel: itemLevel,
                    itemName: itemName
                });
            });
        }
        Item.showCurrentUsedItemNum();
    },

    /**
     * 在已使用道具列表页面上添加批量转换能量和恢复道具的按钮
     */
    addConvertEnergyAndRestoreItemsButton: function () {
        var safeId = KFOL.getSafeId();
        if (!safeId) return;
        var $lastLine = $('.kf_fw_ig1:eq(1) > tbody > tr:last-child');
        var itemName = $lastLine.find('td:first-child').text();
        if (!itemName) return;
        var matches = /(\d+)级道具/.exec($lastLine.find('td:nth-child(2)').text());
        if (!matches) return;
        var itemLevel = parseInt(matches[1]);
        var itemTypeId = parseInt(Tools.getUrlParam('lv'));
        if (!itemTypeId) return;
        $('.kf_fw_ig1:eq(1) > tbody > tr > td:last-child').each(function () {
            var matches = /kf_fw_ig_my\.php\?pro=(\d+)/.exec($(this).find('a').attr('href'));
            if (!matches) return;
            $(this).css('width', '500')
                .parent()
                .append('<td style="width:20px;padding-right:5px"><input class="pd_input" type="checkbox" value="{0}" /></td>'
                    .replace('{0}', matches[1])
                );
        });
        $('<div class="pd_item_btns"><button class="pd_highlight" title="批量将指定道具转换为能量">转换能量</button>' +
            '<button title="批量恢复指定道具">恢复道具</button><button>全选</button><button>反选</button></div>')
            .insertAfter('.kf_fw_ig1:eq(1)')
            .find('button:first-child')
            .click(function () {
                KFOL.removePopTips($('.pd_pop_tips'));
                var itemIdList = [];
                $('.kf_fw_ig1:eq(1) input[type="checkbox"]:checked').each(function () {
                    itemIdList.push(parseInt($(this).val()));
                });
                if (itemIdList.length === 0) return;
                if (!window.confirm('共选择了{0}个道具，是否转换为能量？'.replace('{0}', itemIdList.length))) return;
                KFOL.showWaitMsg('<strong>正在转换能量中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                    .replace('{0}', itemIdList.length)
                    , true);
                Item.convertItemsToEnergy({
                    type: 2,
                    itemIdList: itemIdList,
                    safeId: safeId,
                    itemLevel: itemLevel,
                    itemName: itemName
                });
            })
            .next()
            .click(function () {
                KFOL.removePopTips($('.pd_pop_tips'));
                var itemIdList = [];
                $('.kf_fw_ig1:eq(1) input[type="checkbox"]:checked').each(function () {
                    itemIdList.push(parseInt($(this).val()));
                });
                if (itemIdList.length === 0) return;
                var totalRequiredEnergyNum = itemIdList.length * Item.getRestoreEnergyNumByItemLevel(itemLevel);
                if (!window.confirm('共选择了{0}个道具，共需要{1}点恢复能量，是否恢复道具？'
                        .replace('{0}', itemIdList.length)
                        .replace('{1}', totalRequiredEnergyNum)
                    )
                ) return;
                var totalEnergyNum = parseInt($('.kf_fw_ig1 td:contains("道具恢复能量")').find('span').text());
                if (!totalEnergyNum || totalEnergyNum < totalRequiredEnergyNum) {
                    alert('所需恢复能量不足');
                    return;
                }
                KFOL.showWaitMsg('<strong>正在恢复道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                    .replace('{0}', itemIdList.length)
                    , true);
                Item.restoreItems({
                    type: 2,
                    itemIdList: itemIdList,
                    safeId: safeId,
                    itemLevel: itemLevel,
                    itemTypeId: itemTypeId,
                    itemName: itemName
                });
            })
            .next()
            .click(function () {
                $('.kf_fw_ig1:eq(1) input[type="checkbox"]').prop('checked', true);
            })
            .next()
            .click(function () {
                $('.kf_fw_ig1:eq(1) input[type="checkbox"]').each(function () {
                    $(this).prop('checked', !$(this).prop('checked'));
                });
            });
    },

    /**
     * 在道具恢复页面上添加批量转换道具为能量和批量恢复道具的链接
     */
    addBatchConvertEnergyAndRestoreItemsLink: function () {
        var $myItems = $('.kf_fw_ig1:last');
        $myItems.find('tbody > tr').each(function (index) {
            var $this = $(this);
            if (index === 0) {
                $this.find('td').attr('colspan', 6);
            }
            else if (index === 1) {
                $this.find('td:nth-child(2)').attr('width', 200)
                    .next('td').attr('width', 100).wrapInner('<span class="pd_used_num pd_custom_tips" style="color:#000"></span>')
                    .next('td').attr('width', 130).text('批量恢复')
                    .next('td').attr('width', 160)
                    .before('<td width="160">批量转换</td>');
            }
            else {
                $this.find('td:nth-child(3)')
                    .wrapInner('<span class="pd_used_num pd_custom_tips"></span>')
                    .end()
                    .find('td:nth-child(4)')
                    .html('<a class="pd_items_batch_restore {0}" href="#" title="批量恢复指定数量的道具">批量恢复道具</a>'
                        .replace('{0}', index === 2 ? 'pd_disabled_link' : '')
                    )
                    .after('<td><a class="pd_items_batch_convert pd_highlight {0}" href="#" title="批量将指定数量的道具转换为能量">批量转换道具为能量</a></td>'
                        .replace('{0}', index === 2 ? 'pd_disabled_link' : '')
                    );
                var matches = /lv=(\d+)/i.exec($this.find('td:last-child').find('a').attr('href'));
                if (matches) $this.data('itemTypeId', parseInt(matches[1]));
            }
        });
        Item.bindItemActionLinksClick($myItems);

        var $itemName = $myItems.find('tbody > tr:gt(1) > td:nth-child(2)');
        Item.addSampleItemsLink($itemName);
        Item.showItemUsedInfo($itemName.find('a'));
        Item.showUsedItemEnergyTips();
    },

    /**
     * 为我的道具页面中的道具操作链接绑定点击事件
     * @param {jQuery} $element 要绑定的容器元素
     */
    bindItemActionLinksClick: function ($element) {
        var safeId = KFOL.getSafeId();
        if (!safeId) return;
        $element.on('click', 'a[href="#"]', function (e) {
            e.preventDefault();
            var $this = $(this);
            if ($this.is('.pd_disabled_link')) return;
            var $itemLine = $this.closest('tr'),
                itemLevel = parseInt($itemLine.find('td:first-child').text()),
                itemTypeId = parseInt($itemLine.data('itemTypeId')),
                itemName = $itemLine.find('td:nth-child(2) > a').text(),
                itemUsableNum = parseInt($itemLine.find('td:nth-child(3) > .pd_usable_num').text()),
                itemUsedNum = parseInt($itemLine.find('td:nth-child(3) > .pd_used_num').text()),
                itemListUrl = '';
            if (isNaN(itemTypeId) || itemTypeId <= 0) return;

            if ($this.is('.pd_items_batch_use')) {
                var num = parseInt(
                    window.prompt('你要使用多少个【Lv.{0}：{1}】道具？'
                        .replace('{0}', itemLevel)
                        .replace('{1}', itemName)
                        , itemUsableNum ? itemUsableNum : 0)
                );
                if (isNaN(num) || num <= 0) return;
                KFOL.removePopTips($('.pd_pop_tips'));

                KFOL.showWaitMsg('正在获取本种类未使用道具列表，请稍后...', true);
                itemListUrl = $itemLine.find('td:last-child').find('a:first-child').attr('href') + '&t=' + new Date().getTime();
                $.get(itemListUrl, function (html) {
                    KFOL.removePopTips($('.pd_pop_tips'));
                    var itemIdList = Item.getItemIdList(html, num);
                    if (itemIdList.length === 0) {
                        alert('本种类没有未使用的道具');
                        return;
                    }
                    console.log('批量使用道具Start，使用道具数量：' + itemIdList.length);
                    KFOL.showWaitMsg('<strong>正在使用道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                        .replace('{0}', itemIdList.length)
                        , true);
                    Item.useItems({
                        type: 1,
                        itemIdList: itemIdList,
                        safeId: safeId,
                        itemLevel: itemLevel,
                        itemTypeId: itemTypeId,
                        itemName: itemName,
                        $itemLine: $itemLine
                    });
                }, 'html');
            }
            else if ($this.is('.pd_items_cycle_use')) {
                var value = window.prompt(
                    ('你要循环使用多少个【Lv.{0}：{1}】道具？\n' +
                    '（可直接填写道具数量，也可使用“道具数量|使用道具轮数上限|恢复道具成功次数上限”的格式[上限设为0表示不限制]，例一：7；例二：5|3；例三：3|0|6）')
                        .replace('{0}', itemLevel)
                        .replace('{1}', itemName)
                    , itemUsableNum ? itemUsableNum : 0);
                if (value === null) return;
                value = $.trim(value);
                if (!/\d+(\|\d+)?(\|\d+)?/.test(value)) {
                    alert('格式不正确');
                    return;
                }
                var arr = value.split('|');
                var num = 0, maxUseItemRound = 0, maxSuccessRestoreItemCount = 0;
                num = parseInt(arr[0]);
                if (!num) return;
                if (typeof arr[1] !== 'undefined') maxUseItemRound = parseInt(arr[1]);
                if (typeof arr[2] !== 'undefined') maxSuccessRestoreItemCount = parseInt(arr[2]);
                KFOL.removePopTips($('.pd_pop_tips'));

                KFOL.showWaitMsg('正在获取本种类未使用道具列表，请稍后...', true);
                itemListUrl = $itemLine.find('td:last-child').find('a:first-child').attr('href') + '&t=' + new Date().getTime();
                $.get(itemListUrl, function (html) {
                    KFOL.removePopTips($('.pd_pop_tips'));
                    var itemIdList = Item.getItemIdList(html, num);
                    if (itemIdList.length === 0) {
                        alert('本种类没有未使用的道具');
                        return;
                    }
                    KFOL.showWaitMsg('正在获取当前道具相关信息，请稍后...', true);
                    $.get('kf_fw_ig_my.php?t=' + new Date().getTime(), function (html) {
                        Item.showCurrentUsableItemNum(html);
                        $.get('kf_fw_ig_renew.php?t=' + new Date().getTime(), function (html) {
                            KFOL.removePopTips($('.pd_pop_tips'));
                            var totalEnergyNum = Item.getCurrentEnergyNum(html);
                            Item.showCurrentUsedItemNum(html);
                            Item.cycleUseItems(1, {
                                type: 1,
                                itemIdList: itemIdList,
                                safeId: safeId,
                                itemLevel: itemLevel,
                                itemTypeId: itemTypeId,
                                itemName: itemName,
                                $itemLine: $itemLine
                            }, {
                                itemNum: itemIdList.length,
                                round: 1,
                                totalEnergyNum: totalEnergyNum,
                                countStat: {},
                                stat: {},
                                maxUseItemRound: maxUseItemRound,
                                maxSuccessRestoreItemCount: maxSuccessRestoreItemCount
                            });
                        }, 'html');
                    }, 'html');
                }, 'html');
            }
            else if ($this.is('.pd_items_batch_restore')) {
                var num = parseInt(
                    window.prompt('你要恢复多少个【Lv.{0}：{1}】道具？'
                        .replace('{0}', itemLevel)
                        .replace('{1}', itemName)
                        , itemUsedNum ? itemUsedNum : 0)
                );
                if (isNaN(num) || num <= 0) return;
                KFOL.removePopTips($('.pd_pop_tips'));

                itemListUrl = $itemLine.find('td:last-child').find('a:last-child').attr('href') + '&t=' + new Date().getTime();
                KFOL.showWaitMsg('正在获取本种类已使用道具列表，请稍后...', true);
                $.get(itemListUrl, function (html) {
                    KFOL.removePopTips($('.pd_pop_tips'));
                    var itemIdList = Item.getItemIdList(html, num);
                    if (itemIdList.length === 0) {
                        alert('本种类没有已使用的道具');
                        return;
                    }
                    console.log('批量恢复道具Start，恢复道具数量：' + itemIdList.length);
                    KFOL.showWaitMsg('<strong>正在恢复道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                        .replace('{0}', itemIdList.length)
                        , true);
                    Item.restoreItems({
                        type: 1,
                        itemIdList: itemIdList,
                        safeId: safeId,
                        itemLevel: itemLevel,
                        itemTypeId: itemTypeId,
                        itemName: itemName,
                        $itemLine: $itemLine
                    });
                }, 'html');
            }
            else if ($this.is('.pd_items_batch_convert')) {
                var num = parseInt(
                    window.prompt('你要将多少个【Lv.{0}：{1}】道具转换为能量？'
                        .replace('{0}', itemLevel)
                        .replace('{1}', itemName)
                        , itemUsedNum ? itemUsedNum : 0)
                );
                if (isNaN(num) || num <= 0) return;
                KFOL.removePopTips($('.pd_pop_tips'));

                itemListUrl = $itemLine.find('td:last-child').find('a:last-child').attr('href') + '&t=' + new Date().getTime();
                KFOL.showWaitMsg('正在获取本种类已使用道具列表，请稍后...', true);
                $.get(itemListUrl, function (html) {
                    KFOL.removePopTips($('.pd_pop_tips'));
                    var itemIdList = Item.getItemIdList(html, num);
                    if (itemIdList.length === 0) {
                        alert('本种类没有已使用的道具');
                        return;
                    }
                    console.log('批量转换道具为能量Start，转换道具数量：' + itemIdList.length);
                    KFOL.showWaitMsg('<strong>正在转换能量中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                        .replace('{0}', itemIdList.length)
                        , true);
                    Item.convertItemsToEnergy({
                        type: 1,
                        itemIdList: itemIdList,
                        safeId: safeId,
                        itemLevel: itemLevel,
                        itemName: itemName,
                        $itemLine: $itemLine
                    });
                }, 'html');
            }
        });
    },

    /**
     * 增强我的道具页面
     */
    enhanceMyItemsPage: function () {
        var $myItems = $('.kf_fw_ig1:last');
        $myItems.addClass('pd_my_items').find('tbody > tr').each(function (index) {
            var $this = $(this);
            if (index === 0) {
                $this.find('td').attr('colspan', 6);
            }
            else if (index === 1) {
                $this.find('td:first-child').css('width', '75px')
                    .end().find('td:nth-child(2)').css('width', '185px')
                    .end().find('td:nth-child(3)').css('width', '105px').html('<span class="pd_usable_num">可用数</span> / <span class="pd_used_num pd_custom_tips">已用数</span>')
                    .end().find('td:last-child').css('width', '165px')
                    .before('<td style="width:135px">使用道具</td><td style="width:135px">恢复道具 和 转换能量</td>');
            }
            else {
                $this.find('td:nth-child(3)')
                    .wrapInner('<span class="pd_usable_num" style="margin-left:5px"></span>')
                    .append(' / <span class="pd_used_num pd_custom_tips">?</span>')
                    .after(
                        ('<td><a class="pd_items_batch_use" href="#" title="批量使用指定数量的道具">批量使用</a>' +
                        '<a class="pd_items_cycle_use pd_highlight {0}" href="#" title="循环使用和恢复指定数量的道具，直至停止操作或没有道具可以恢复">循环使用</a></td>' +
                        '<td><a class="pd_items_batch_restore {0}" href="#" title="批量恢复指定数量的道具">批量恢复</a>' +
                        '<a class="pd_items_batch_convert pd_highlight {0}" href="#" title="批量将指定数量的道具转换为能量">批量转换</a></td>')
                            .replace(/\{0\}/g, index === 2 ? 'pd_disabled_link' : '')
                    );
                var $listLinkColumn = $this.find('td:last-child');
                var matches = /lv=(\d+)/i.exec($listLinkColumn.find('a').attr('href'));
                if (matches) {
                    var itemTypeId = parseInt(matches[1]);
                    $this.data('itemTypeId', itemTypeId);
                    $listLinkColumn.find('a').text('未使用列表')
                        .after('<a class="pd_highlight" href="kf_fw_ig_renew.php?lv={0}">已使用列表</a>'.replace('{0}', itemTypeId));
                }
            }
        });
        Item.bindItemActionLinksClick($myItems);

        var $itemName = $myItems.find('tbody > tr:gt(1) > td:nth-child(2)');
        Item.addSampleItemsLink($itemName);
        Item.showItemUsedInfo($itemName.find('a'));
        Item.showCurrentUsedItemNum();
    },

    /**
     * 设定当前指定种类道具的未使用和已使用数量以及道具恢复能量
     * @param {?jQuery} $itemLine 当前道具所在的表格行
     * @param {?number} usedChangeNum 已使用道具的变化数量
     * @param {?number} [usableChangeNum] 未使用道具的变化数量
     * @param {?number} [energyChangeNum] 道具恢复能量的变化数量
     */
    setCurrentItemUsableAndUsedNum: function ($itemLine, usedChangeNum, usableChangeNum, energyChangeNum) {
        var flag = false;
        if ($itemLine) {
            var $itemUsed = $itemLine.find('td:nth-child(3) > .pd_used_num');
            var itemName = $itemLine.find('td:nth-child(2) > a').text();
            if ($itemUsed.length > 0 && itemName !== '零时迷子的碎片') {
                var num = parseInt($itemUsed.text());
                if (isNaN(num) || num + usedChangeNum < 0) {
                    flag = true;
                }
                else {
                    $itemUsed.text(num + usedChangeNum);
                    Item.showUsedItemEnergyTips();
                }
            }
            if (usableChangeNum) {
                var $itemUsable = $itemLine.find('td:nth-child(3) > .pd_usable_num');
                if ($itemUsable.length > 0) {
                    var num = parseInt($itemUsable.text());
                    if (isNaN(num) || num + usableChangeNum < 0) flag = true;
                    else $itemUsable.text(num + usableChangeNum);
                }
            }
        }
        if (energyChangeNum) {
            var $totalEnergy = $('.pd_total_energy_num');
            if (location.pathname === '/kf_fw_ig_renew.php')
                $totalEnergy = $('.kf_fw_ig1:first > tbody > tr:nth-child(2) > td:contains("道具恢复能量") > span');
            if ($totalEnergy.length > 0) {
                var num = parseInt($totalEnergy.text());
                if (isNaN(num) || num + energyChangeNum < 0) flag = true;
                else $totalEnergy.text(num + energyChangeNum);
            }
            else {
                flag = true;
            }
        }
        if (flag) {
            Item.showCurrentUsedItemNum();
            if (location.pathname === '/kf_fw_ig_my.php' && !Tools.getUrlParam('lv')) Item.showCurrentUsableItemNum();
        }
    },

    /**
     * 获取当前道具恢复能量
     * @param {string} html 恢复道具页面的HTML代码
     */
    getCurrentEnergyNum: function (html) {
        var energyNum = 0;
        var energyNumMatches = /道具恢复能量<br\s*\/><span.+?>(\d+)<\/span><br\s*\/>点/i.exec(html);
        if (energyNumMatches) energyNum = parseInt(energyNumMatches[1]);
        return energyNum;
    },

    /**
     * 显示已使用道具恢复所需和转换可得的能量的提示
     */
    showUsedItemEnergyTips: function () {
        var totalRestoreEnergy = 0, totalConvertEnergy = 0;
        $('.kf_fw_ig1:last > tbody > tr:gt(1) > td:nth-child(3) > .pd_used_num').each(function () {
            var $this = $(this);
            var itemNum = parseInt($this.text());
            if (isNaN(itemNum) || itemNum < 0) return;
            var itemLevel = parseInt($this.closest('tr').find('td:first-child').text());
            if (!itemLevel) return;
            var perRestoreEnergy = Item.getRestoreEnergyNumByItemLevel(itemLevel);
            var perConvertEnergy = Item.getGainEnergyNumByItemLevel(itemLevel);
            totalRestoreEnergy += perRestoreEnergy * itemNum;
            totalConvertEnergy += perConvertEnergy * itemNum;
            $this.attr('title', '全部恢复需要{0}点能量，全部转换可得{1}点能量'
                .replace('{0}', perRestoreEnergy * itemNum)
                .replace('{1}', perConvertEnergy * itemNum)
            );
        });
        $('.kf_fw_ig1:last > tbody > tr:nth-child(2) > td:nth-child(3) > .pd_used_num')
            .attr('title', '全部恢复需要{0}点能量，全部转换可得{1}点能量'
                .replace('{0}', totalRestoreEnergy)
                .replace('{1}', totalConvertEnergy)
            );
    },

    /**
     * 在我的道具页面中显示当前各种类已使用道具的数量
     * @param {string} [html] 恢复道具页面的HTML代码（留空表示自动获取HTML代码）
     */
    showCurrentUsedItemNum: function (html) {
        /**
         * 显示数量
         * @param {string} html 恢复道具页面的HTML代码
         */
        var show = function (html) {
            var energyNum = Item.getCurrentEnergyNum(html);
            var introMatches = /(1级道具转换得.+?点能量)。<br/.exec(html);
            if (location.pathname === '/kf_fw_ig_my.php') {
                $('.kf_fw_ig_title1:last').find('span:has(.pd_total_energy_num)').remove()
                    .end().append(
                    '<span class="pd_custom_tips" style="margin-left:7px" title="{0}">(道具恢复能量 <b class="pd_total_energy_num" style="font-size:14px">{1}</b> 点)</span>'
                        .replace('{0}', introMatches ? introMatches[1] : '')
                        .replace('{1}', energyNum)
                );
            }
            else {
                $('.kf_fw_ig1:first > tbody > tr:nth-child(2) > td:contains("道具恢复能量") > span').text(energyNum);
            }

            if ($('.pd_used_num').length > 0) {
                var matches = html.match(/">\d+<\/td><td>全部转换本级已使用道具为能量<\/td>/ig);
                if (matches) {
                    var usedItemNumList = [];
                    for (var i in matches) {
                        var usedItemNumMatches = /">(\d+)<\/td>/i.exec(matches[i]);
                        if (usedItemNumMatches) usedItemNumList.push(usedItemNumMatches[1]);
                    }
                    var $usedNum = $('.kf_fw_ig1:last > tbody > tr:gt(1) > td:nth-child(3) > .pd_used_num');
                    if ($usedNum.length === matches.length) {
                        $usedNum.each(function (index) {
                            $(this).text(usedItemNumList[index]);
                        });
                        Item.showUsedItemEnergyTips();
                    }
                }
            }
        };

        if (html) {
            show(html);
        }
        else {
            $.get('kf_fw_ig_renew.php?t=' + new Date().getTime(), function (html) {
                show(html);
            }, 'html');
        }
    },

    /**
     * 在我的道具页面中显示当前各种类可使用道具的数量
     * @param {string} [html] 我的道具页面的HTML代码（留空表示自动获取HTML代码）
     */
    showCurrentUsableItemNum: function (html) {
        /**
         * 显示数量
         * @param {string} html 我的道具页面的HTML代码
         */
        var show = function (html) {
            var matches = html.match(/">\d+<\/td><td><a href="kf_fw_ig_my\.php\?lv=/ig);
            if (!matches) return;
            var usableItemNumList = [];
            for (var i in matches) {
                var usableItemNumMatches = /">(\d+)<\/td>/i.exec(matches[i]);
                if (usableItemNumMatches) usableItemNumList.push(usableItemNumMatches[1]);
            }
            $('.kf_fw_ig1:last > tbody > tr:gt(1) > td:nth-child(3) > .pd_usable_num').each(function (index) {
                $(this).text(usableItemNumList[index] ? usableItemNumList[index] : 0);
            });
        };

        if (html) {
            show(html);
        }
        else {
            $.get('kf_fw_ig_my.php?t=' + new Date().getTime(), function (html) {
                show(html);
            }, 'html');
        }
    },

    /**
     * 显示道具使用情况
     * @param {jQuery} $links 道具名称的链接列表
     */
    showItemUsedInfo: function ($links) {
        $.get('kf_fw_ig_index.php?t=' + new Date().getTime(), function (html) {
            var itemUsedNumList = Loot.getLootPropertyList(html)['道具使用列表'];
            $links.next('.pd_used_item_info').remove();
            $links.each(function () {
                var $this = $(this);
                var itemName = $this.text();
                if (typeof itemUsedNumList[itemName] === 'undefined') return;
                var usedNum = itemUsedNumList[itemName];
                var maxUsedNum = Item.getItemMaxUsedNumByItemName(itemName);
                var nextSuccessPercent = 0;
                if (usedNum > maxUsedNum) nextSuccessPercent = 0;
                else nextSuccessPercent = (1 - usedNum / maxUsedNum) * 100;
                $this.after('<span class="pd_used_item_info" title="下个道具使用成功几率：{0}">(<span style="{1}">{2}</span>/<span style="color:#F00">{3}</span>)</span>'
                    .replace('{0}', usedNum >= maxUsedNum ? '无' : nextSuccessPercent.toFixed(2) + '%')
                    .replace('{1}', usedNum >= maxUsedNum ? 'color:#F00' : '')
                    .replace('{2}', usedNum)
                    .replace('{3}', maxUsedNum)
                );
            });
        });
    },

    /**
     * 添加道具样品的链接
     * @param {jQuery} $nodes 道具名称的节点列表
     */
    addSampleItemsLink: function ($nodes) {
        $nodes.each(function () {
            var $this = $(this);
            var itemName = $.trim($this.text());
            var itemLevel = Item.getItemLevelByItemName(itemName);
            if (itemName && typeof Const.sampleItemIdList[itemName] !== 'undefined') {
                var title = '';
                if (itemName !== '零时迷子的碎片') {
                    title = '恢复此道具需{0}点能量，转换此道具可得{1}点能量'
                        .replace('{0}', Item.getRestoreEnergyNumByItemLevel(itemLevel))
                        .replace('{1}', Item.getGainEnergyNumByItemLevel(itemLevel));
                }
                else {
                    title = '此道具不可恢复和转换';
                }
                $this.html('<a href="kf_fw_ig_my.php?pro={0}&display=1" title="{1}">{2}</a>'
                    .replace('{0}', Const.sampleItemIdList[itemName])
                    .replace('{1}', title)
                    .replace('{2}', itemName)
                );
            }
        });
    },

    /**
     * 添加道具样品提示
     */
    addSampleItemTips: function () {
        var itemId = parseInt(Tools.getUrlParam('pro'));
        if (isNaN(itemId) || itemId <= 0) return;
        for (var itemName in Const.sampleItemIdList) {
            if (itemId === Const.sampleItemIdList[itemName]) {
                $('.kf_fw_ig1 > tbody > tr:nth-child(3) > td:last-child').find('span:first').after('<span class="pd_notice" style="margin-left:5px">(展示用样品)</span>');
                break;
            }
        }
    },

    /**
     * 购买指定种类的道具
     * @param {{}} options 设置项
     * @param {number} options.itemTypeId 指定的道具种类ID
     * @param {number} options.num 欲购买的道具数量
     * @param {string} options.safeId 用户的SafeID
     * @param {number} options.itemLevel 道具等级
     * @param {string} options.itemName 道具名称
     */
    buyItems: function (options) {
        var settings = {
            itemTypeId: 0,
            num: 0,
            safeId: '',
            itemLevel: 0,
            itemName: ''
        };
        $.extend(settings, options);
        $('.kf_fw_ig1').parent().append('<ul class="pd_result"><li><strong>【Lv.{0}：{1}】购买结果：</strong></li></ul>'
            .replace('{0}', settings.itemLevel)
            .replace('{1}', settings.itemName)
        );

        var successNum = 0;
        var isStop = false;
        $(document).clearQueue('BatchBuyItems');
        $.each(new Array(settings.num), function (index) {
            $(document).queue('BatchBuyItems', function () {
                $.ajax({
                    type: 'GET',
                    url: 'kf_fw_ig_shop.php?lvid={0}&safeid={1}&t={2}'
                        .replace('{0}', settings.itemTypeId)
                        .replace('{1}', settings.safeId)
                        .replace('{2}', new Date().getTime()),
                    success: function (html) {
                        KFOL.showFormatLog('购买道具', html);
                        var msg = '';
                        var matches = /<a href="kf_fw_ig_my\.php\?pro=(\d+)">/i.exec(html);
                        if (matches) {
                            successNum++;
                            msg = '获得了<a target="_blank" href="kf_fw_ig_my.php?pro={0}" data-id="{0}">一个道具</a>'.replace(/\{0\}/g, matches[1]);
                        }
                        else if (/你需要持有该道具两倍市场价的KFB/i.test(html)) {
                            msg = '你需要持有该道具两倍市场价的KFB<span class="pd_notice">（购买操作中止）</span>';
                            isStop = true;
                        }
                        else {
                            msg = '未能获得预期的回应';
                        }
                        $('.pd_result:last').append('<li><b>第{0}次：</b>{1}</li>'.replace('{0}', index + 1).replace('{1}', msg));
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        isStop = isStop || $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('BatchBuyItems');

                        if (isStop || index === settings.num - 1) {
                            KFOL.removePopTips($remainingNum.closest('.pd_pop_tips'));
                            if (successNum > 0) {
                                Log.push('购买道具',
                                    '共有`{0}`个【`Lv.{1}：{2}`】道具购买成功'
                                        .replace('{0}', successNum)
                                        .replace('{1}', settings.itemLevel)
                                        .replace('{2}', settings.itemName),
                                    {gain: {'道具': successNum}}
                                );
                            }
                            console.log('共有{0}个【Lv.{1}：{2}】道具购买成功'
                                .replace('{0}', successNum)
                                .replace('{1}', settings.itemLevel)
                                .replace('{2}', settings.itemName)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>个【<em>Lv.{1}</em>{2}】道具购买成功</strong>'
                                .replace('{0}', successNum)
                                .replace('{1}', settings.itemLevel)
                                .replace('{2}', settings.itemName)
                                , -1);

                            if (successNum > 0) {
                                $('<li><a href="#">统计购买价格</a></li>')
                                    .appendTo('.pd_result:last')
                                    .find('a')
                                    .click(function (e) {
                                        e.preventDefault();
                                        var $result = $(this).closest('.pd_result');
                                        $(this).parent().remove();
                                        KFOL.removePopTips($('.pd_pop_tips'));
                                        Item.statBuyItemsPrice($result, settings.itemLevel, settings.itemName);
                                    });
                                Item.showItemShopBuyInfo();
                            }
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('BatchBuyItems');
                            }, typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        $(document).dequeue('BatchBuyItems');
    },

    /**
     * 统计批量购买道具的购买价格
     * @param {jQuery} $result 购买结果的jQuery对象
     * @param {number} itemLevel 道具等级
     * @param {string} itemName 道具名称
     */
    statBuyItemsPrice: function ($result, itemLevel, itemName) {
        var successNum = 0, failNum = 0, totalPrice = 0, minPrice = 0, maxPrice = 0, marketPrice = 0, totalNum = $result.find('li > a').length;
        $('.kf_fw_ig1:first > tbody > tr:gt(1) > td:nth-child(2)').each(function () {
            var $this = $(this);
            if ($this.find('a').text() === itemName) {
                marketPrice = parseInt($.trim($this.next('td').find('.pd_item_price').text()));
                return false;
            }
        });
        if (!marketPrice) marketPrice = 1;
        KFOL.showWaitMsg('<strong>正在统计购买价格中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i>'
            .replace('{0}', totalNum)
            , true);
        $(document).clearQueue('StatBuyItemsPrice');
        $result.find('li > a').each(function (index) {
            var $this = $(this);
            var itemId = $this.data('id');
            if (!itemId) return;
            $(document).queue('StatBuyItemsPrice', function () {
                $.get('kf_fw_ig_my.php?pro={0}&t={1}'.replace('{0}', itemId).replace('{1}', new Date().getTime()), function (html) {
                    var $remainingNum = $('#pd_remaining_num');
                    $remainingNum.text(parseInt($remainingNum.text()) - 1);
                    var matches = /从商店购买，购买价(\d+)KFB。<br>/i.exec(html);
                    if (matches) {
                        successNum++;
                        var price = parseInt(matches[1]);
                        totalPrice += price;
                        if (minPrice === 0) minPrice = price;
                        else if (price < minPrice) minPrice = price;
                        if (price > maxPrice) maxPrice = price;
                        $this.after('（购买价：<b class="pd_highlight">{0}</b>KFB）'.replace('{0}', price));
                    }
                    else {
                        failNum++;
                        $this.after('<span class="pd_notice">（未能获得预期的回应）</span>');
                    }
                    if (index === totalNum - 1) {
                        KFOL.removePopTips($('.pd_pop_tips'));
                        if (successNum > 0) {
                            Log.push('统计道具购买价格',
                                '共有`{0}`个【`Lv.{1}：{2}`】道具统计成功{3}，总计价格：`{4}`，平均价格：`{5}`(`{6}%`)，最低价格：`{7}`(`{8}%`)，最高价格：`{9}`(`{10}%`)'
                                    .replace('{0}', successNum)
                                    .replace('{1}', itemLevel)
                                    .replace('{2}', itemName)
                                    .replace('{3}', failNum > 0 ? '（共有`{0}`个道具未能统计成功）'.replace('{0}', failNum) : '')
                                    .replace('{4}', totalPrice.toLocaleString())
                                    .replace('{5}', successNum > 0 ? Tools.getFixedNumberLocaleString(totalPrice / successNum, 2) : 0)
                                    .replace('{6}', successNum > 0 ? Math.round(totalPrice / successNum / marketPrice * 100) : 0)
                                    .replace('{7}', minPrice.toLocaleString())
                                    .replace('{8}', Math.round(minPrice / marketPrice * 100))
                                    .replace('{9}', maxPrice.toLocaleString())
                                    .replace('{10}', Math.round(maxPrice / marketPrice * 100))
                                , {pay: {'KFB': -totalPrice}}
                            );
                        }
                        console.log('统计道具购买价格（KFB）（共有{0}个道具未能统计成功），统计成功数量：{1}，总计价格：{2}，平均价格：{3} ({4}%)，最低价格：{5} ({6}%)，最高价格：{7} ({8}%)'
                            .replace('{0}', failNum)
                            .replace('{1}', successNum)
                            .replace('{2}', totalPrice.toLocaleString())
                            .replace('{3}', successNum > 0 ? Tools.getFixedNumberLocaleString(totalPrice / successNum, 2) : 0)
                            .replace('{4}', successNum > 0 ? Math.round(totalPrice / successNum / marketPrice * 100) : 0)
                            .replace('{5}', minPrice.toLocaleString())
                            .replace('{6}', Math.round(minPrice / marketPrice * 100))
                            .replace('{7}', maxPrice.toLocaleString())
                            .replace('{8}', Math.round(maxPrice / marketPrice * 100))
                        );
                        $result.append(
                            ('<li class="pd_stat"><b>统计结果{0}：</b><br /><i>统计成功数量：<em>{1}</em></i> <i>总计价格：<em>{2}</em></i> ' +
                            '<i>平均价格：<em>{3} ({4}%)</em></i> <i>最低价格：<em>{5} ({6}%)</em></i> <i>最高价格：<em>{7} ({8}%)</em></i></li>')
                                .replace('{0}', failNum > 0 ? '<span class="pd_notice">（共有{0}个道具未能统计成功）</span>'.replace('{0}', failNum) : '')
                                .replace('{1}', successNum)
                                .replace('{2}', totalPrice.toLocaleString())
                                .replace('{3}', successNum > 0 ? Tools.getFixedNumberLocaleString(totalPrice / successNum, 2) : 0)
                                .replace('{4}', successNum > 0 ? Math.round(totalPrice / successNum / marketPrice * 100) : 0)
                                .replace('{5}', minPrice.toLocaleString())
                                .replace('{6}', Math.round(minPrice / marketPrice * 100))
                                .replace('{7}', maxPrice.toLocaleString())
                                .replace('{8}', Math.round(maxPrice / marketPrice * 100))
                        );
                    }
                    else {
                        window.setTimeout(function () {
                            $(document).dequeue('StatBuyItemsPrice');
                        }, Const.defAjaxInterval);
                    }
                }, 'html');
            });
        });
        $(document).dequeue('StatBuyItemsPrice');
    },

    /**
     * 在道具商店页面上添加批量购买道具的链接
     */
    addBatchBuyItemsLink: function () {
        var $shop = $('.kf_fw_ig1:first');

        $shop.find('tbody > tr:nth-child(2)')
            .find('td:nth-child(2)').css('width', '243px')
            .end().find('td:nth-child(3)').css('width', '155px')
            .end().find('td:last-child').css('width', '110px');

        $shop.find('tbody > tr:gt(1)').each(function () {
            $(this).find('td:nth-child(3)').wrapInner('<span class="pd_item_price"></span>')
                .end().find('td:last-child').append('<a class="pd_batch_buy_items" style="margin-left:15px" href="#">批量购买</a>');
        });

        $shop.on('click', 'a[href^="kf_fw_ig_shop.php?lvid="]', function () {
            var $this = $(this);
            var itemLevel = parseInt($this.closest('tr').find('td:first-child').text());
            if (!itemLevel) return;
            var itemName = $this.closest('tr').find('td:nth-child(2)').text();
            if (!itemName) return;
            if (!window.confirm('是否购买【Lv.{0}：{1}】道具？'.replace('{0}', itemLevel).replace('{1}', itemName))) {
                return false;
            }
        }).on('click', 'a.pd_batch_buy_items', function (e) {
            e.preventDefault();
            KFOL.removePopTips($('.pd_pop_tips'));
            var $this = $(this);
            var itemLevel = parseInt($this.closest('tr').find('td:first-child').text());
            if (!itemLevel) return;
            var itemName = $this.closest('tr').find('td:nth-child(2) > a').text();
            if (!itemName) return;
            var matches = /lvid=(\d+)&safeid=(\w+)/i.exec($this.prev('a').attr('href'));
            if (!matches) return;
            var itemTypeId = parseInt(matches[1]);
            var safeId = matches[2];
            var num = parseInt(
                $.trim(window.prompt('你要批量购买多少个【Lv.{0}：{1}】道具？'
                    .replace('{0}', itemLevel)
                    .replace('{1}', itemName)
                    , 0))
            );
            if (isNaN(num) || num <= 0) return;
            KFOL.showWaitMsg('<strong>正在购买道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                .replace('{0}', num)
                , true);
            Item.buyItems({itemTypeId: itemTypeId, num: num, safeId: safeId, itemLevel: itemLevel, itemName: itemName});
        });

        $shop.find('tbody > tr:gt(1) > td:nth-child(4)').each(function () {
            var $this = $(this);
            var price = parseInt($.trim($this.prev('td').text()));
            if (isNaN(price)) return;
            $this.addClass('pd_custom_tips').attr('title', '{0}~{1}（均价：{2}）'
                .replace('{0}', Math.floor(price * 0.5))
                .replace('{1}', price * 2)
                .replace('{2}', Math.floor(price * 1.25))
            );
        });

        var $itemName = $shop.find('tbody > tr:gt(1) > td:nth-child(2)');
        Item.addSampleItemsLink($itemName);
        Item.showItemUsedInfo($itemName.find('a'));
        Item.showItemShopBuyInfo();
        $shop.find('tbody > tr:first-child > td').append(
            '<br /><span class="pd_highlight">想买道具却害怕使用失败？快来试试' +
            '<a href="read.php?tid=526110" target="_blank" title="喵拉布丁：我绝对没收广告费~">道具使用险</a>吧！</span>'
        );
    },

    /**
     * 显示道具商店可购买情况
     */
    showItemShopBuyInfo: function () {
        $.get('profile.php?action=show&uid={0}&t={1}'.replace('{0}', KFOL.uid).replace('{1}', new Date().getTime()), function (html) {
            var matches = /论坛货币：(\d+)\s*KFB<br \/>/i.exec(html);
            if (!matches) return;
            var cash = parseInt(matches[1]);
            $('.kf_fw_ig_title1:last').find('span:last').remove()
                .end().append('<span style="margin-left:7px">(当前持有 <b style="font-size:14px">{0}</b> KFB)</span>'.replace('{0}', cash));
            $('.kf_fw_ig1:first > tbody > tr:gt(1) > td:nth-child(3) > .pd_item_price').each(function () {
                var $this = $(this);
                $this.next('.pd_verify_tips').remove();
                var price = parseInt($.trim($this.text()));
                if (isNaN(price)) return;
                var tips = '', title = '';
                if (price * 2 <= cash) {
                    tips = '<span style="color:#669933">可买</span>';
                    title = '有足够KFB购买此道具';
                }
                else {
                    tips = '<span style="color:#FF0033">差{0}</span>'.replace('{0}', price * 2 - cash);
                    title = '还差{0}KFB才可购买此道具'.replace('{0}', price * 2 - cash);
                }
                $this.after('<span class="pd_verify_tips" title="{0}" style="font-size:12px;margin-left:3px">({1})</span>'.replace('{0}', title).replace('{1}', tips));
            });
        });
    }
};

/**
 * 卡片类
 */
var Card = {
    /**
     * 将指定的一系列卡片转换为VIP时间
     * @param {number[]} cardList 卡片ID列表
     * @param {string} safeId 用户的SafeID
     */
    convertCardsToVipTime: function (cardList, safeId) {
        var successNum = 0, failNum = 0, totalVipTime = 0, totalEnergy = 0;
        $(document).clearQueue('ConvertCardsToVipTime');
        $.each(cardList, function (index, cardId) {
            $(document).queue('ConvertCardsToVipTime', function () {
                $.ajax({
                    type: 'GET',
                    url: 'kf_fw_card_doit.php?do=recard&id={0}&safeid={1}&t={2}'
                        .replace('{0}', cardId)
                        .replace('{1}', safeId)
                        .replace('{2}', new Date().getTime()),
                    success: function (html) {
                        KFOL.showFormatLog('将卡片转换为VIP时间', html);
                        var matches = /增加(\d+)小时VIP时间(?:.*?获得(\d+)点恢复能量)?/i.exec(html);
                        if (matches) {
                            successNum++;
                            totalVipTime += parseInt(matches[1]);
                            if (typeof matches[2] !== 'undefined') totalEnergy += parseInt(matches[2]);
                        }
                        else failNum++;
                    },
                    error: function () {
                        failNum++;
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('ConvertCardsToVipTime');

                        if (isStop || index === cardList.length - 1) {
                            if (successNum > 0) {
                                Log.push('将卡片转换为VIP时间', '共有`{0}`张卡片成功为VIP时间'.replace('{0}', successNum),
                                    {
                                        gain: {'VIP小时': totalVipTime, '能量': totalEnergy},
                                        pay: {'卡片': -successNum}
                                    }
                                );
                            }
                            KFOL.removePopTips($('.pd_pop_tips'));
                            console.log('共有{0}张卡片转换成功，共有{1}张卡片转换失败，VIP小时+{2}，能量+{3}'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum)
                                .replace('{2}', totalVipTime)
                                .replace('{3}', totalEnergy)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>张卡片转换成功{1}</strong><i>VIP小时<em>+{2}</em></i><i>能量<em>+{3}</em></i>'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>张卡片转换失败'.replace('{0}', failNum) : '')
                                .replace('{2}', totalVipTime)
                                .replace('{3}', totalEnergy)
                                , -1);
                            $('.kf_fw_ig2 .pd_card_chk:checked')
                                .closest('td')
                                .fadeOut('normal', function () {
                                    var $parent = $(this).parent();
                                    $(this).remove();
                                    if ($parent.children().length === 0) $parent.remove();
                                });
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('ConvertCardsToVipTime');
                            }, Const.defAjaxInterval);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        $(document).dequeue('ConvertCardsToVipTime');
    },

    /**
     * 添加开启批量模式的按钮
     */
    addStartBatchModeButton: function () {
        var safeId = KFOL.getSafeId();
        if (!safeId) return;
        if ($('.kf_fw_ig2 a[href^="kf_fw_card_my.php?id="]').length === 0) return;
        $('<div class="pd_item_btns"><button>开启批量模式</button></div>').insertAfter('.kf_fw_ig2')
            .find('button').click(function () {
            var $this = $(this);
            var $cardLines = $('.kf_fw_ig2 > tbody > tr:gt(2)');
            if ($this.text() === '开启批量模式') {
                $this.text('关闭批量模式');
                $cardLines.on('click', 'a', function (e) {
                    e.preventDefault();
                    $(this).next('.pd_card_chk').click();
                }).find('td').has('a').each(function () {
                    var matches = /kf_fw_card_my\.php\?id=(\d+)/.exec($(this).find('a').attr('href'));
                    if (!matches) return;
                    $(this).css('position', 'relative')
                        .append('<input class="pd_card_chk" type="checkbox" value="{0}" />'
                            .replace('{0}', matches[1]));
                });
                var playedCardList = [];
                $('.kf_fw_ig2 > tbody > tr:nth-child(2) > td').each(function () {
                    var matches = /kf_fw_card_my\.php\?id=(\d+)/.exec($(this).find('a').attr('href'));
                    if (!matches) return;
                    playedCardList.push(parseInt(matches[1]));
                });
                var uncheckPlayedCard = function () {
                    for (var i in playedCardList) {
                        $cardLines.find('td').has('a[href="kf_fw_card_my.php?id={0}"]'.replace('{0}', playedCardList[i]))
                            .find('input:checked').prop('checked', false);
                    }
                };
                $this.before('<label><input id="uncheckPlayedCard" type="checkbox" checked="checked" /> 不选已出战的卡片</label>' +
                        '<button>每类只保留一张</button><button>全选</button><button>反选</button><br /><button>转换为VIP时间</button>')
                    .prev()
                    .click(function () {
                        KFOL.removePopTips($('.pd_pop_tips'));
                        var cardList = [];
                        $cardLines.find('input:checked').each(function () {
                            cardList.push(parseInt($(this).val()));
                        });
                        if (cardList.length === 0) return;
                        if (!window.confirm('共选择了{0}张卡片，是否将卡片批量转换为VIP时间？'.replace('{0}', cardList.length))) return;
                        KFOL.showWaitMsg('<strong>正在批量转换中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                            .replace('{0}', cardList.length)
                            , true);
                        Card.convertCardsToVipTime(cardList, safeId);
                    })
                    .prev()
                    .prev()
                    .click(function () {
                        $cardLines.find('input').each(function () {
                            $(this).prop('checked', !$(this).prop('checked'));
                        });
                        if ($('#uncheckPlayedCard').prop('checked')) uncheckPlayedCard();
                    })
                    .prev()
                    .click(function () {
                        $cardLines.find('input').prop('checked', true);
                        if ($('#uncheckPlayedCard').prop('checked')) uncheckPlayedCard();
                    })
                    .prev()
                    .click(function () {
                        $cardLines.find('input').prop('checked', true);
                        if ($('#uncheckPlayedCard').prop('checked')) uncheckPlayedCard();
                        var cardTypeList = [];
                        $cardLines.find('a > img').each(function () {
                            var src = $(this).attr('src');
                            if ($.inArray(src, cardTypeList) === -1) cardTypeList.push(src);
                        });
                        for (var i in cardTypeList) {
                            var $cardElems = $cardLines.find('td').has('img[src="{0}"]'.replace('{0}', cardTypeList[i]));
                            var totalNum = $cardElems.length;
                            var checkedNum = $cardElems.has('input:checked').length;
                            if (totalNum > 1) {
                                if (totalNum === checkedNum) {
                                    $cardElems.eq(0).find('input:checked').prop('checked', false);
                                }
                            }
                            else {
                                $cardElems.find('input:checked').prop('checked', false);
                            }
                        }
                    });
            }
            else {
                $this.text('开启批量模式');
                $cardLines.off('click').find('.pd_card_chk').remove();
                $this.prevAll().remove();
            }
        });
    }
};

/**
 * 银行类
 */
var Bank = {
    // 最低转账金额
    minTransferMoney: 20,

    /**
     * 给活期帐户存款
     * @param {number} money 存款金额（KFB）
     * @param {number} cash 现金（KFB）
     * @param {number} currentDeposit 现有活期存款（KFB）
     */
    saveCurrentDeposit: function (money, cash, currentDeposit) {
        var $tips = KFOL.showWaitMsg('正在存款中...', true);
        $.post('hack.php?H_name=bank',
            {action: 'save', btype: 1, savemoney: money},
            function (html) {
                if (/完成存款/.test(html)) {
                    KFOL.showFormatLog('存款', html);
                    KFOL.removePopTips($tips);
                    console.log('共有{0}KFB存入活期存款'.replace('{0}', money));
                    var $account = $('.bank1 > tbody > tr:nth-child(2) > td:contains("当前所持：")');
                    $account.html($account.html().replace(/当前所持：-?\d+KFB/i,
                        '当前所持：{0}KFB'.replace('{0}', cash - money)
                        ).replace(/活期存款：-?\d+KFB/i,
                        '活期存款：{0}KFB'.replace('{0}', currentDeposit + money)
                        )
                    );
                    window.setTimeout(function () {
                        $(document).dequeue('Bank');
                    }, 5000);
                }
                else {
                    $(document).clearQueue('Bank');
                    alert('存款失败');
                }
            }, 'html');
    },

    /**
     * 从活期帐户取款
     * @param {number} money 取款金额（KFB）
     */
    drawCurrentDeposit: function (money) {
        var $tips = KFOL.showWaitMsg('正在取款中...', true);
        $.post('hack.php?H_name=bank',
            {action: 'draw', btype: 1, drawmoney: money},
            function (html) {
                KFOL.removePopTips($tips);
                if (/完成取款/.test(html)) {
                    KFOL.showFormatLog('取款', html);
                    console.log('从活期存款中取出了{0}KFB'.replace('{0}', money));
                    KFOL.showMsg('从活期存款中取出了<em>{0}</em>KFB'.replace('{0}', money), -1);
                }
                else if (/取款金额大于您的存款金额/.test(html)) {
                    KFOL.showMsg('取款金额大于当前活期存款金额', -1);
                }
                else if (/\d+秒内不允许重新交易/.test(html)) {
                    KFOL.showMsg('提交速度过快', -1);
                }
                else {
                    KFOL.showMsg('取款失败', -1);
                }
            }, 'html');
    },

    /**
     * 批量转账
     * @param {Array} users 用户列表
     * @param {string} msg 转帐附言
     * @param {boolean} isDeposited 是否已存款
     * @param {number} currentDeposit 现有活期存款
     */
    batchTransfer: function (users, msg, isDeposited, currentDeposit) {
        var successNum = 0, failNum = 0, successMoney = 0;
        $.each(users, function (index, key) {
            $(document).queue('Bank', function () {
                $.ajax({
                    url: 'hack.php?H_name=bank',
                    type: 'POST',
                    data: '&action=virement&pwuser={0}&to_money={1}&memo={2}'
                        .replace('{0}', Tools.getGBKEncodeString(key[0]))
                        .replace('{1}', key[1])
                        .replace('{2}', Tools.getGBKEncodeString(msg))
                    ,
                    success: function (html) {
                        KFOL.showFormatLog('批量转账', html);
                        var msg = '';
                        if (/完成转帐!<\/span>/.test(html)) {
                            successNum++;
                            successMoney += key[1];
                            msg = '{0} <em>+{1}</em>'.replace('{0}', key[0]).replace('{1}', key[1]);
                        }
                        else {
                            failNum++;
                            var errorMsg = '';
                            if (/用户<b>.+?<\/b>不存在<br \/>/.test(html)) {
                                errorMsg = '用户不存在';
                            }
                            else if (/您的存款不够支付转帐/.test(html)) {
                                errorMsg = '存款不足';
                            }
                            else if (/转账额度不足/.test(html)) {
                                errorMsg = '转账额度不足';
                            }
                            else if (/当前等级无法使用该功能/.test(html)) {
                                errorMsg = '当前等级无法使用转账功能';
                            }
                            else if (/转帐数目填写不正确/.test(html)) {
                                errorMsg = '转帐金额不正确';
                            }
                            else if (/自己无法给自己转帐/.test(html)) {
                                errorMsg = '无法给自己转帐';
                            }
                            else if (/\d+秒内不允许重新交易/.test(html)) {
                                errorMsg = '提交速度过快';
                            }
                            else {
                                errorMsg = '未能获得预期的回应';
                            }
                            msg = '{0}:{1} <span class="pd_notice">({2})</span>'
                                .replace('{0}', key[0])
                                .replace('{1}', key[1])
                                .replace('{2}', errorMsg);
                        }
                        $('.pd_result:last').append('<li>{0}</li>'.replace('{0}', msg));
                    },
                    error: function () {
                        failNum++;
                        $('.pd_result:last').append(
                            ('<li>{0}:{1} <span class="pd_notice">(连接超时，转账可能失败，请到' +
                            '<a target="_blank" href="hack.php?H_name=bank&action=log">银行日志</a>里进行确认)</span></li>')
                                .replace('{0}', key[0])
                                .replace('{1}', key[1])
                        );
                    },
                    complete: function () {
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('Bank');

                        if (isStop || index === users.length - 1) {
                            if (successNum > 0) {
                                Log.push('批量转账', '共有`{0}`名用户转账成功'.replace('{0}', successNum), {pay: {'KFB': -successMoney}});
                            }
                            KFOL.removePopTips($('.pd_pop_tips'));
                            var $account = $('.bank1 > tbody > tr:nth-child(2) > td:contains("活期存款：")');
                            $account.html($account.html().replace(/活期存款：-?\d+KFB/i,
                                '活期存款：{0}KFB'.replace('{0}', currentDeposit - successMoney)
                                )
                            );
                            console.log('共有{0}名用户转账成功，共有{1}名用户转账失败，KFB-{2}'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum)
                                .replace('{2}', successMoney)
                            );
                            $('.pd_result:last').append('<li><b>共有<em>{0}</em>名用户转账成功{1}：</b>KFB <ins>-{2}</ins></li>'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>名用户转账失败'.replace('{0}', failNum) : '')
                                .replace('{2}', successMoney)
                            );
                            KFOL.showMsg('<strong>共有<em>{0}</em>名用户转账成功{1}</strong><i>KFB<ins>-{2}</ins></i>'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>名用户转账失败'.replace('{0}', failNum) : '')
                                .replace('{2}', successMoney)
                            );
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('Bank');
                            }, 5000);
                        }
                    },
                    dataType: 'html'
                });
            });
        });
        if (!isDeposited) $(document).dequeue('Bank');
    },

    /**
     * 验证批量转账的字段值是否正确
     * @returns {boolean} 是否正确
     */
    batchTransferVerify: function () {
        var $bankUsers = $('#pd_bank_users');
        var users = $bankUsers.val();
        if (!/^\s*\S+\s*$/m.test(users) || /^\s*:/m.test(users) || /:/.test(users) && /:(\D|$)/m.test(users)) {
            alert('用户列表格式不正确');
            $bankUsers.select();
            $bankUsers.focus();
            return false;
        }
        if (/^\s*\S+?:0*[0-1]?\d\s*$/m.test(users)) {
            alert('转帐金额不能小于{0}KFB'.replace('{0}', Bank.minTransferMoney));
            $bankUsers.select();
            $bankUsers.focus();
            return false;
        }
        var $bankMoney = $('#pd_bank_money');
        var money = parseInt($.trim($bankMoney.val()));
        if (/^\s*[^:]+\s*$/m.test(users)) {
            if (!$.isNumeric(money)) {
                alert('通用转账金额格式不正确');
                $bankMoney.select();
                $bankMoney.focus();
                return false;
            }
            else if (money < Bank.minTransferMoney) {
                alert('转帐金额不能小于{0}KFB'.replace('{0}', Bank.minTransferMoney));
                $bankMoney.select();
                $bankMoney.focus();
                return false;
            }
        }
        return true;
    },

    /**
     * 添加批量转账的按钮
     */
    addBatchTransferButton: function () {
        var html =
            '<tr id="pd_bank_transfer">' +
            '  <td style="vertical-align:top">使用说明：<br />每行一名用户，<br />如需单独设定金额，<br />可写为“用户名:金额”<br />（注意是<b>英文冒号</b>）<br />' +
            '例子：<br /><pre style="border:1px solid #9999FF;padding:5px">张三\n李四:200\n王五:500\n信仰风</pre></td>' +
            '  <td>' +
            '  <form>' +
            '    <div style="display:inline-block"><label>用户列表：<br />' +
            '<textarea class="pd_textarea" id="pd_bank_users" style="width:270px;height:250px"></textarea></label></div>' +
            '    <div style="display:inline-block;margin-left:10px;">' +
            '      <label>通用转帐金额（如所有用户都已设定单独金额则可留空）：<br />' +
            '<input class="pd_input" id="pd_bank_money" type="text" style="width:217px" maxlength="15" /></label><br />' +
            '      <label style="margin-top:5px">转帐附言（可留空）：<br />' +
            '<textarea class="pd_textarea" id="pd_bank_msg" style="width:225px;height:206px" id="pd_bank_users"></textarea></label>' +
            '    </div>' +
            '    <div><label><input class="pd_input" type="submit" value="批量转账" /></label>' +
            '<label style="margin-left:3px"><input class="pd_input" type="reset" value="重置" /></label>' +
            '<label style="margin-left:3px"><input class="pd_input" type="button" value="随机金额" title="为用户列表上的每个用户设定指定范围内的随机金额" /></label>' +
            ' （活期存款不足时，将自动进行存款；批量转账金额不会从定期存款中扣除）</div>' +
            '  </form>' +
            '  </td>' +
            '</tr>';
        $(html).appendTo('.bank1 > tbody')
            .find('form')
            .submit(function (e) {
                e.preventDefault();
                KFOL.removePopTips($('.pd_pop_tips'));
                if (!Bank.batchTransferVerify()) return;
                var commonMoney = parseInt($.trim($('#pd_bank_money').val()));
                if (!commonMoney) commonMoney = 0;
                var msg = $('#pd_bank_msg').val();
                var users = [];
                $.each($('#pd_bank_users').val().split('\n'), function (index, line) {
                    line = $.trim(line);
                    if (!line) return;
                    if (line.indexOf(':') > -1) {
                        var arr = line.split(':');
                        if (arr.length < 2) return;
                        users.push([$.trim(arr[0]), parseInt(arr[1])]);
                    }
                    else {
                        users.push([line, commonMoney]);
                    }
                });
                if (users.length === 0) return;

                var matches = /\(手续费(\d+)%\)/.exec($('td:contains("(手续费")').text());
                if (!matches) return;
                var fee = parseInt(matches[1]) / 100;
                var totalMoney = 0;
                for (var i in users) {
                    totalMoney += users[i][1];
                }
                totalMoney = Math.floor(totalMoney * (1 + fee));
                if (!window.confirm('共计{0}名用户，总额{1}KFB，是否转账？'
                        .replace('{0}', users.length)
                        .replace('{1}', totalMoney)
                    )
                ) return;

                var $tips = KFOL.showWaitMsg('正在获取存款信息中...', true);
                $.get('hack.php?H_name=bank&t=' + new Date().getTime(), function (html) {
                    KFOL.removePopTips($tips);
                    var cash = 0, currentDeposit = 0;
                    var matches = /当前所持：(-?\d+)KFB<br/i.exec(html);
                    if (!matches) return;
                    cash = parseInt(matches[1]);
                    matches = /活期存款：(-?\d+)KFB<br/i.exec(html);
                    if (!matches) return;
                    currentDeposit = parseInt(matches[1]);
                    if (totalMoney > cash + currentDeposit) {
                        alert('资金不足');
                        return;
                    }

                    $(document).clearQueue('Bank');
                    var isDeposited = false;
                    var difference = totalMoney - currentDeposit;
                    if (difference > 0) {
                        isDeposited = true;
                        $(document).queue('Bank', function () {
                            Bank.saveCurrentDeposit(difference, cash, currentDeposit);
                            cash -= difference;
                            currentDeposit += difference;
                        });
                        $(document).dequeue('Bank');
                    }
                    KFOL.showWaitMsg('<strong>正在批量转账中，请耐心等待...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                        .replace('{0}', users.length)
                        , true);
                    $('#pd_bank_transfer > td:last-child').append('<ul class="pd_result pd_stat"><li><strong>转账结果：</strong></li></ul>');
                    Bank.batchTransfer(users, msg, isDeposited, currentDeposit);
                }, 'html');
            })
            .end()
            .find('.pd_input[type="button"]')
            .click(function (e) {
                e.preventDefault();
                var userList = [];
                $.each($('#pd_bank_users').val().split('\n'), function (index, line) {
                    line = $.trim(line);
                    if (!line) return;
                    userList.push($.trim(line.split(':')[0]));
                });
                if (userList.length === 0) return;

                var range = window.prompt('设定随机金额的范围（注：最低转账金额为20KFB）', '20-100');
                if (range === null) return;
                range = $.trim(range);
                if (!/^\d+-\d+$/.test(range)) {
                    alert('随机金额范围格式不正确');
                    return;
                }
                var arr = range.split('-');
                var min = parseInt(arr[0]), max = parseInt(arr[1]);
                if (max < min) {
                    alert('最大值不能低于最小值');
                    return;
                }

                var content = '';
                for (var i in userList) {
                    content += userList[i] + ':' + Math.floor(Math.random() * (max - min + 1) + min) + '\n';
                }
                $('#pd_bank_users').val(content);
            });
    },

    /**
     * 在银行页面对页面元素进行处理
     */
    handleInBankPage: function () {
        var $account = $('.bank1 > tbody > tr:nth-child(2) > td:contains("可获利息：")');
        var interestHtml = $account.html();
        var matches = /可获利息：(\d+)\(/i.exec(interestHtml);
        var interest = 0;
        if (matches) {
            interest = parseInt(matches[1]);
            if (interest > 0) {
                $account.html(interestHtml.replace(/可获利息：\d+\(/i,
                    '可获利息：<b class="pd_highlight">{0}</b>('.replace('{0}', interest)
                    )
                );
            }
        }

        var fixedDepositHtml = $account.html();
        matches = /定期存款：(\d+)KFB/i.exec(fixedDepositHtml);
        if (matches) {
            var fixedDeposit = parseInt(matches[1]);
            if (fixedDeposit > 0 && interest === 0) {
                var time = parseInt(TmpLog.getValue(Const.fixedDepositDueTmpLogName));
                if (!isNaN(time) && time > new Date().getTime()) {
                    fixedDepositHtml = fixedDepositHtml.replace('期间不存取定期，才可以获得利息）',
                        '期间不存取定期，才可以获得利息）<span style="color:#999">（到期时间：{0} {1}）</span>'
                            .replace('{0}', Tools.getDateString(new Date(time)))
                            .replace('{1}', Tools.getTimeString(new Date(time), ':', false))
                    );
                    $account.html(fixedDepositHtml);
                }

                matches = /定期利息：([\d\.]+)%/.exec(fixedDepositHtml);
                if (matches) {
                    var interestRate = parseFloat(matches[1]) / 100;
                    var anticipatedInterest = Math.round(fixedDeposit * interestRate * Const.fixedDepositDueTime);
                    fixedDepositHtml = fixedDepositHtml.replace('取出定期将获得该数额的KFB利息)',
                        '取出定期将获得该数额的KFB利息)<span style="color:#999">（预期利息：{0}KFB）</span>'
                            .replace('{0}', anticipatedInterest)
                    );
                    $account.html(fixedDepositHtml);
                }
            }
        }

        $('form[name="form1"], form[name="form2"]').submit(function () {
            var $this = $(this);
            var money = 0;
            if ($this.is('[name="form2"]')) money = parseInt($.trim($this.find('input[name="drawmoney"]').val()));
            else money = parseInt($.trim($this.find('input[name="savemoney"]').val()));
            if (parseInt($this.find('input[name="btype"]:checked').val()) === 2 && money > 0) {
                TmpLog.setValue(Const.fixedDepositDueTmpLogName, Tools.getDate('+' + Const.fixedDepositDueTime + 'd').getTime());
            }
        });

        $('form[name="form3"]').submit(function () {
            var matches = /活期存款：(-?\d+)KFB/i.exec($('td:contains("活期存款：")').text());
            if (!matches) return;
            var currentDeposit = parseInt(matches[1]);
            matches = /定期存款：(\d+)KFB/i.exec($('td:contains("定期存款：")').text());
            if (!matches) return;
            var fixedDeposit = parseInt(matches[1]);
            var money = parseInt($.trim($('input[name="to_money"]').val()));
            if (!isNaN(money) && fixedDeposit > 0 && money > currentDeposit) {
                if (!window.confirm('你的活期存款不足，转账金额将从定期存款里扣除，是否继续？')) {
                    $(this).find('input[type="submit"]').prop('disabled', false);
                    return false;
                }
            }
        });
    },

    /**
     * 定期存款到期提醒
     */
    fixedDepositDueAlert: function () {
        console.log('定期存款到期提醒Start');
        $.get('hack.php?H_name=bank&t=' + new Date().getTime(), function (html) {
            Tools.setCookie(Const.fixedDepositDueAlertCookieName, 1, Tools.getMidnightHourDate(1));
            var matches = /可获利息：(\d+)\(/.exec(html);
            if (!matches) return;
            var interest = parseInt(matches[1]);
            if (interest > 0) {
                Tools.setCookie(Const.fixedDepositDueAlertCookieName, 1, Tools.getMidnightHourDate(7));
                if (window.confirm('您的定期存款已到期，共产生利息{0}KFB，是否前往银行取款？'.replace('{0}', interest))) {
                    location.href = 'hack.php?H_name=bank';
                }
            }
        }, 'html');
    }
};

/**
 * 争夺类
 */
var Loot = {
    /**
     * 领取争夺奖励
     * @param {boolean} [isAutoDonation=false] 是否自动捐款
     * @param {boolean} [isAutoSaveCurrentDeposit=false] 是否自动活期存款
     */
    getLootAward: function (isAutoDonation, isAutoSaveCurrentDeposit) {
        if (Config.noAutoLootWhen.length > 0) {
            var now = new Date();
            for (var i in Config.noAutoLootWhen) {
                if (Tools.isBetweenInTimeRange(now, Config.noAutoLootWhen[i])) {
                    if (isAutoDonation) KFOL.donation();
                    return;
                }
            }
        }

        /**
         * 自动攻击
         * @param {string} safeId 用户的SafeID
         * @param {number} deadlyAttackNum 致命一击的攻击次数
         */
        var autoAttack = function (safeId, deadlyAttackNum) {
            if (Config.autoAttackEnabled && !$.isEmptyObject(Config.batchAttackList) && safeId) {
                if (Loot.isAutoAttackNow()) {
                    Tools.setCookie(Const.autoAttackReadyCookieName, '1|' + safeId, Tools.getDate('+' + Const.defLootInterval + 'm'));
                    Loot.autoAttack(safeId, deadlyAttackNum);
                }
                else {
                    Tools.setCookie(Const.autoAttackReadyCookieName, '2|' + safeId, Tools.getDate('+' + Const.defLootInterval + 'm'));
                }
            }
        };

        Func.run('Loot.getLootAward_before_');
        console.log('领取争夺奖励Start');
        var $tips = KFOL.showWaitMsg('<strong>正在领取争夺奖励，请稍候...</strong>', true);
        $.get('kf_fw_ig_index.php?t=' + new Date().getTime(), function (html) {
            if (Loot.getNextLootAwardTime().type) {
                KFOL.removePopTips($tips);
                return;
            }
            var matches = /<INPUT name="submit1" type="submit" value="(.+?)"/i.exec(html);
            if (!matches) {
                KFOL.removePopTips($tips);
                var nextTime = Tools.getDate('+' + Const.defLootInterval + 'm');
                Tools.setCookie(Const.getLootAwardCookieName, '1|' + nextTime.getTime(), nextTime);
                return;
            }

            var safeIdMatches = /<a href="kf_fw_card_pk\.php\?safeid=(\w+)">/i.exec(html);
            var safeId = '';
            if (safeIdMatches) safeId = safeIdMatches[1];

            var deadlyAttackNum = 0;
            if (Config.deadlyAttackId > 0) {
                var deadlyAttackMatches = /致命一击剩余攻击次数\s*(\d+)\s*次/i.exec(html);
                if (deadlyAttackMatches) deadlyAttackNum = parseInt(deadlyAttackMatches[1]);
                if (deadlyAttackNum > Const.maxAttackNum) deadlyAttackNum = Const.maxAttackNum;
            }

            var remainingMatches = /还有(\d+)(分钟|小时)领取/i.exec(matches[1]);
            if (remainingMatches) {
                KFOL.removePopTips($tips);
                var lootInterval = parseInt(remainingMatches[1]);
                if (remainingMatches[2] === '小时') lootInterval = lootInterval * 60;
                lootInterval++;
                var nextTime = Tools.getDate('+' + lootInterval + 'm');
                Tools.setCookie(Const.getLootAwardCookieName,
                    '{0}|{1}'.replace('{0}', remainingMatches[2] === '小时' ? 1 : 2).replace('{1}', nextTime.getTime()),
                    nextTime
                );
                if (Config.attemptAttackEnabled) {
                    var nextCheckInterval = Const.firstCheckLifeInterval - (Const.defLootInterval - lootInterval);
                    if (nextCheckInterval <= 0) nextCheckInterval = 1;
                    var nextCheckTime = Tools.getDate('+' + nextCheckInterval + 'm');
                    Tools.setCookie(Const.checkLifeCookieName, nextCheckTime.getTime(), nextCheckTime);
                    Tools.setCookie(Const.attackCountCookieName, 0, Tools.getDate('+' + Const.defLootInterval + 'm'));
                }

                var attackNumMatches = />本回合剩余攻击次数\s*(\d+)\s*次<\/span><br/.exec(html);
                if (attackNumMatches && parseInt(attackNumMatches[1]) > 0) {
                    autoAttack(safeId, deadlyAttackNum);
                }
                if (isAutoDonation) KFOL.donation();
            }
            else if (/(点击这里预领KFB|已经可以领取KFB)/i.test(matches[1])) {
                if (Config.deferLootTimeWhenRemainAttackNumEnabled) {
                    var remainAttackNumMatches = /本回合剩余攻击次数\s*(\d+)\s*次/.exec(html);
                    var remainAttackNum = 0;
                    if (remainAttackNumMatches) remainAttackNum = parseInt(remainAttackNumMatches[1]);
                    if (remainAttackNum >= Config.deferLootTimeWhenRemainAttackNum && !Tools.getCookie(Const.drawSmboxCookieName)) {
                        KFOL.removePopTips($tips);
                        console.log('检测到本回合剩余攻击次数还有{0}次，抽取神秘盒子以延长争夺时间'.replace('{0}', remainAttackNum));
                        KFOL.drawSmbox();
                        if (isAutoDonation) KFOL.donation();
                        return;
                    }
                }

                var gainMatches = /当前拥有\s*<span style=".+?">(\d+)<\/span>\s*预领KFB<br \/>/i.exec(html);
                var gain = 0;
                if (gainMatches) gain = parseInt(gainMatches[1]);

                var attackLogList = Loot.getMonsterAttackLogList(html);
                var lootInfo = Loot.getLootInfo(html);

                $.post('kf_fw_ig_index.php',
                    {submit1: 1, one: 1},
                    function (msg) {
                        KFOL.removePopTips($tips);
                        KFOL.showFormatLog('领取争夺奖励', msg);
                        if (/(领取成功！|已经预领\d+KFB)/i.test(msg)) {
                            var nextTime = Tools.getDate('+' + Const.defLootInterval + 'm');
                            Tools.setCookie(Const.getLootAwardCookieName, '2|' + nextTime.getTime(), nextTime);
                            if (Config.attemptAttackEnabled) {
                                var nextCheckTime = Tools.getDate('+' + Const.firstCheckLifeInterval + 'm');
                                Tools.setCookie(Const.checkLifeCookieName, nextCheckTime.getTime(), nextCheckTime);
                                Tools.setCookie(Const.attackCountCookieName, 0, Tools.getDate('+' + Const.defLootInterval + 'm'));
                            }

                            var lootCountDiff = -1, attackKfbDiff = -1, attackedCountDiff = -1, attackedKfbDiff = -1;
                            if (lootInfo) {
                                var prevLootInfo = Loot.getPrevLootInfo();
                                if (prevLootInfo) {
                                    lootCountDiff = lootInfo.lootCount - prevLootInfo.lootCount;
                                    if (lootCountDiff === 1) {
                                        attackKfbDiff = lootInfo.attackKfb - prevLootInfo.attackKfb;
                                        attackedCountDiff = lootInfo.attackedCount - prevLootInfo.attackedCount;
                                    }
                                }
                                TmpLog.setValue(Const.prevLootInfoTmpLogName, lootInfo);
                            }

                            if (/已经预领\d+KFB/i.test(msg)) {
                                gain = 0;
                            }
                            else {
                                var options = {gain: {'KFB': gain}};
                                if (attackKfbDiff >= 0) attackedKfbDiff = attackKfbDiff + Const.lootInitialBonus - gain;
                                if (attackKfbDiff >= 0 && attackedKfbDiff >= 0) {
                                    options['gain']['夺取KFB'] = attackKfbDiff;
                                    options['pay'] = {'夺取KFB': -attackedKfbDiff};
                                }
                                Log.push('领取争夺奖励',
                                    '领取争夺奖励{0}'.replace('{0}', attackedCountDiff > 0 ? '(共受到`{0}`次攻击)'.replace('{0}', attackedCountDiff) : ''), options
                                );
                            }
                            console.log('领取争夺奖励{0}，KFB+{1}{2}{3}'
                                .replace('{0}', attackedCountDiff >= 0 ? '(共受到{0}次攻击)'.replace('{0}', attackedCountDiff) : '')
                                .replace('{1}', gain)
                                .replace('{2}', attackKfbDiff >= 0 ? '，夺取KFB+' + attackKfbDiff : '')
                                .replace('{3}', attackedKfbDiff >= 0 ? '，夺取KFB-' + attackedKfbDiff : '')
                            );
                            var $msg = KFOL.showMsg('<strong>领取争夺奖励{0}</strong><i>KFB<em>+{1}</em></i>{2}{3}{4}{5}'
                                .replace('{0}', attackedCountDiff >= 0 ? ' (共受到<em>{0}</em>次攻击)'.replace('{0}', attackedCountDiff) : '')
                                .replace('{1}', gain)
                                .replace('{2}', attackKfbDiff >= 0 ? '<i>夺取KFB<em>+{0}</em></i>'.replace('{0}', attackKfbDiff) : '')
                                .replace('{3}', attackedKfbDiff >= 0 ? '<i>夺取KFB<ins>-{0}</ins></i>'.replace('{0}', attackedKfbDiff) : '')
                                .replace('{4}', attackLogList.length > 0 ? '<a href="#">查看日志</a>' : '')
                                .replace('{5}', !Config.autoAttackEnabled ? '<a target="_blank" href="kf_fw_ig_pklist.php">手动攻击</a>' : '')
                            );
                            $msg.find('a[href="#"]:first').click(function (e) {
                                e.preventDefault();
                                Loot.showAttackLogDialog(2, attackLogList);
                            });
                            autoAttack(safeId, deadlyAttackNum);
                            if (isAutoDonation) KFOL.donation();
                            if (isAutoSaveCurrentDeposit) KFOL.autoSaveCurrentDeposit(true);
                            Func.run('Loot.getLootAward_after_', html);
                        }
                    }, 'html');
            }
            else {
                KFOL.removePopTips($tips);
                var nextTime = Tools.getDate('+' + Const.defLootInterval + 'm');
                Tools.setCookie(Const.getLootAwardCookieName, '1|' + nextTime.getTime(), nextTime);
                if (isAutoDonation) KFOL.donation();
            }
        }, 'html');
    },

    /**
     * 自动攻击
     * @param {string} safeId 用户的SafeID
     * @param {number} [deadlyAttackNum=-1] 致命一击的攻击次数（-1表示自动检查致命一击的剩余次数）
     */
    autoAttack: function (safeId, deadlyAttackNum) {
        var $remainingTips = $('#pd_remaining_num').closest('.pd_pop_tips');
        if ($remainingTips.length > 0 && !$remainingTips.data('retry')) {
            Tools.setCookie(Const.autoAttackingCookieName, 1, Tools.getDate('+' + Const.checkAutoAttackingInterval + 'm'));
            $remainingTips.data('retry', 1);
            return;
        }
        Func.run('Loot.autoAttack_before_');
        KFOL.removePopTips($remainingTips);

        /**
         * 攻击
         * @param {number} [deadlyAttackId=0] 致命一击的攻击目标ID
         * @param {number} [deadlyAttackNum=0] 致命一击的攻击次数
         */
        var attack = function (deadlyAttackId, deadlyAttackNum) {
            if (!deadlyAttackId) deadlyAttackId = 0;
            if (!deadlyAttackNum) deadlyAttackNum = 0;
            var attackList = {};
            if (deadlyAttackNum > 0) attackList['0' + deadlyAttackId] = deadlyAttackNum;
            if (Config.attemptAttackEnabled) {
                var attackCount = parseInt(Tools.getCookie(Const.attackCountCookieName));
                if (isNaN(attackCount) || attackCount < 0) attackCount = 0;
                var num = 0;
                for (var id in Config.batchAttackList) {
                    for (var i = 1; i <= Config.batchAttackList[id]; i++) {
                        num++;
                        if (num > Const.maxAttackNum - deadlyAttackNum) break;
                        if (num > attackCount) {
                            if (typeof attackList['0' + id] === 'undefined') attackList['0' + id] = 1;
                            else attackList['0' + id]++;
                        }
                    }
                }
            }
            else if (deadlyAttackNum > 0) {
                var num = 0;
                for (var id in Config.batchAttackList) {
                    for (var i = 1; i <= Config.batchAttackList[id]; i++) {
                        num++;
                        if (num > Const.maxAttackNum - deadlyAttackNum) break;
                        if (typeof attackList['0' + id] === 'undefined') attackList['0' + id] = 1;
                        else attackList['0' + id]++;
                    }
                }
            }
            if ($.isEmptyObject(attackList)) attackList = Config.batchAttackList;
            var totalAttackNum = 0;
            for (var id in attackList) {
                totalAttackNum += attackList[id];
            }
            if (!totalAttackNum) return;
            Tools.setCookie(Const.autoAttackingCookieName, 1, Tools.getDate('+' + Const.checkAutoAttackingInterval + 'm'));
            KFOL.showWaitMsg(
                ('<strong>正在批量攻击中，请耐心等待...</strong><i>攻击次数：<em id="pd_remaining_num">{0}</em></i>' +
                '<a target="_blank" href="{1}">浏览其它页面</a><a class="pd_stop_action pd_highlight" href="#">停止操作</a>')
                    .replace('{0}', totalAttackNum)
                    .replace('{1}', location.href)
                , true);
            Loot.batchAttack({
                type: 2,
                totalAttackNum: totalAttackNum,
                attackList: attackList,
                safeId: safeId
            });
        };

        if (!$.isNumeric(deadlyAttackNum)) deadlyAttackNum = -1;
        if (Config.deadlyAttackId > 0) {
            if (deadlyAttackNum === -1) {
                console.log('检查致命一击剩余攻击次数Start');
                $.get('kf_fw_ig_index.php?t=' + new Date().getTime(), function (html) {
                    var deadlyAttackNum = 0;
                    var matches = /致命一击剩余攻击次数\s*(\d+)\s*次/i.exec(html);
                    if (matches) deadlyAttackNum = parseInt(matches[1]);
                    if (deadlyAttackNum > Const.maxAttackNum) deadlyAttackNum = Const.maxAttackNum;
                    if (deadlyAttackNum > 0) attack(Config.deadlyAttackId, deadlyAttackNum);
                    else attack();
                }, 'html');
            }
            else {
                attack(Config.deadlyAttackId, deadlyAttackNum);
            }
        }
        else {
            attack();
        }
    },

    /**
     * 通过回应获取攻击收获
     * @param {string} msg 攻击回应
     * @returns {{}} 攻击收获
     */
    getGainViaMsg: function (msg) {
        var gain = {};
        var matches = /被实际夺取(\d+)KFB/i.exec(msg);
        if (matches) gain['夺取KFB'] = parseInt(matches[1]);
        matches = /被实际燃烧(\d+)KFB/i.exec(msg);
        if (matches) gain['经验值'] = parseInt(matches[1]);
        matches = /掉落道具!(.+?)$/.exec(msg);
        if (matches) {
            gain['道具'] = 1;
            var item = {};
            item[matches[1]] = 1;
            gain['item'] = item;
        }
        return gain;
    },

    /**
     * 批量攻击
     * @param {{}} options 设置项
     * @param {number} options.type 攻击类型，1：在争夺页面中进行批量攻击；2：在自动争夺中进行批量攻击；3：进行试探攻击
     * @param {number} options.totalAttackNum 总攻击次数
     * @param {{}} options.attackList 攻击目标列表
     * @param {string} options.safeId 用户的SafeID
     * @param {string} [options.life] 当前实际生命值（用于试探攻击）
     * @param {string} [options.recentMonsterAttackLog] 最近一次的被怪物攻击日志（用于试探攻击）
     */
    batchAttack: function (options) {
        var settings = {
            type: 1,
            totalAttackNum: 0,
            attackList: {},
            safeId: '',
            life: 0,
            recentMonsterAttackLog: ''
        };
        $.extend(settings, options);
        Func.run('Loot.batchAttack_before_');
        if (settings.type === 1)
            $('.kf_fw_ig1').parent().append('<div class="pd_result"><strong>攻击结果：</strong><ul></ul></div>');
        var count = 0, successNum = 0, failNum = 0, strongAttackNum = 0, criticalStrikeNum = 0;
        var gain = {'夺取KFB': 0, '经验值': 0};
        var isStop = false, isRetakeSafeId = false;
        var attackLogList = [];
        var oriHtml = '', customHtml = '';

        /**
         * 攻击指定ID的怪物
         * @param {number} id 攻击ID
         */
        var attack = function (id) {
            count++;
            $.ajax({
                type: 'POST',
                url: 'kf_fw_ig_pkhit.php',
                data: {uid: id, safeid: settings.safeId},
                success: function (msg) {
                    if (/发起争夺/.test(msg)) {
                        successNum++;
                        if (/触发暴击!/.test(msg)) strongAttackNum++;
                        if (/致命一击!/.test(msg)) criticalStrikeNum++;
                        $.each(Loot.getGainViaMsg(msg), function (key, data) {
                            if (key === 'item') {
                                if (typeof gain[key] === 'undefined') gain['item'] = {};
                                for (var k in data) {
                                    if (typeof gain['item'][k] === 'undefined') gain['item'][k] = data[k];
                                    else gain['item'][k] += data[k];
                                }
                            }
                            else {
                                if (typeof gain[key] === 'undefined') gain[key] = data;
                                else gain[key] += data;
                            }
                        });
                    }
                    else if (/每次攻击间隔\d+秒/.test(msg)) {
                        failNum++;
                        $(document).queue('BatchAttack', function () {
                            attack(id);
                        });
                    }
                    else if (/⑧2/.test(msg)) {
                        msg = 'SafeID错误（尝试重新获取SafeID）';
                        isRetakeSafeId = true;
                        failNum++;
                        $(document).queue('BatchAttack', function () {
                            attack(id);
                        });
                    }
                    else if (/(⑧1|⑧3)/.test(msg)) {
                        failNum++;
                    }
                    else {
                        isStop = true;
                    }
                    attackLogList.push('第{0}次：{1}{2}'.replace('{0}', count).replace('{1}', msg).replace('{2}', isStop ? '（攻击已中止）' : ''));
                    if (settings.type === 3)
                        console.log('【试探攻击】{0}{1}'.replace('{0}', msg).replace('{1}', isStop ? '（攻击已中止）' : ''));
                    else
                        console.log('【批量攻击】第{0}次：{1}{2}'.replace('{0}', count).replace('{1}', msg).replace('{2}', isStop ? '（攻击已中止）' : ''));
                    if (settings.type === 1) {
                        var html = '<li><b>第{0}次：</b>{1}{2}</li>'
                            .replace('{0}', count)
                            .replace('{1}', msg)
                            .replace('{2}', isStop ? '<span class="pd_notice">（攻击已中止）</span>' : '');
                        oriHtml += html;
                        if (Config.customMonsterNameEnabled && !$.isEmptyObject(Config.customMonsterNameList)) {
                            $.each(Config.customMonsterNameList, function (id, name) {
                                var oriName = Loot.getMonsterNameById(parseInt(id));
                                html = html.replace(
                                    '对[{0}]'.replace('{0}', oriName),
                                    '对<span class="pd_custom_tips" title="{0}">[{1}]</span>'.replace('{0}', oriName).replace('{1}', name)
                                );
                            });
                            customHtml += html;
                        }
                        $('.pd_result:last > ul').append(html);
                    }

                },
                error: function () {
                    failNum++;
                    attackLogList.push('第{0}次：{1}'.replace('{0}', count).replace('{1}', '连接超时'));
                    console.log('【{0}攻击】第{1}次：{2}'.replace('{0}', settings.type === 3 ? '试探' : '批量').replace('{1}', count).replace('{2}', '连接超时'));
                    if (settings.type === 1) {
                        var html = '<li><b>第{0}次：</b>{1}</li>'
                            .replace('{0}', count)
                            .replace('{1}', '<span class="pd_notice">连接超时</span>');
                        $('.pd_result:last > ul').append(html);
                    }
                    $(document).queue('BatchAttack', function () {
                        attack(id);
                    });
                },
                complete: function () {
                    var $remainingNum = $('#pd_remaining_num');
                    $remainingNum.text(settings.totalAttackNum + failNum - count);
                    isStop = isStop || $remainingNum.closest('.pd_pop_tips').data('stop');
                    if (isStop) $(document).clearQueue('BatchAttack');

                    if (isStop || count === settings.totalAttackNum + failNum) {
                        KFOL.removePopTips($remainingNum.closest('.pd_pop_tips'));
                        if (gain['夺取KFB'] === 0) delete gain['夺取KFB'];
                        if (gain['经验值'] === 0) delete gain['经验值'];
                        if (successNum > 0) {
                            var extraLog = '';
                            if (strongAttackNum > 0) extraLog += '暴击`+{0}`'.replace('{0}', strongAttackNum);
                            if (criticalStrikeNum > 0) extraLog += (extraLog ? '，' : '') + '致命一击`+{0}`'.replace('{0}', criticalStrikeNum);
                            if (extraLog) extraLog = '(' + extraLog + ')';
                            if (settings.type === 3) Log.push('试探攻击', '成功进行了`{0}`次试探攻击'.replace('{0}', successNum) + extraLog, {gain: gain});
                            else Log.push('批量攻击', '共有`{0}`次攻击成功'.replace('{0}', successNum) + extraLog, {gain: gain});
                        }

                        var msgStat = '', logStat = '', resultStat = '';
                        for (var key in gain) {
                            if (key === 'item') {
                                msgStat += '<br />';
                                for (var itemName in gain['item']) {
                                    msgStat += '<i>{0}<em>+{1}</em></i>'.replace('{0}', itemName).replace('{1}', gain['item'][itemName]);
                                    logStat += '，{0}+{1}'.replace('{0}', itemName).replace('{1}', gain['item'][itemName]);
                                    resultStat += '<i>{0}<em>+{1}</em></i> '.replace('{0}', itemName).replace('{1}', gain['item'][itemName]);
                                }
                            }
                            else {
                                msgStat += '<i>{0}<em>+{1}</em></i>'.replace('{0}', key).replace('{1}', gain[key]);
                                logStat += '，{0}+{1}'.replace('{0}', key).replace('{1}', gain[key]);
                                resultStat += '<i>{0}<em>+{1}</em></i> '.replace('{0}', key).replace('{1}', gain[key]);
                            }
                        }
                        console.log((settings.type === 3 ? '成功进行了{0}次试探攻击'.replace('{0}', successNum) : '共有{0}次攻击成功'.replace('{0}', successNum)) + logStat);

                        var extraMsg = '';
                        if (strongAttackNum > 0) extraMsg += '暴击<em>+{0}</em>'.replace('{0}', strongAttackNum);
                        if (criticalStrikeNum > 0) extraMsg += (extraMsg ? ' ' : '') + '致命一击<em>+{0}</em>'.replace('{0}', criticalStrikeNum);
                        if (extraMsg) extraMsg = '（' + extraMsg + '）';
                        var $msg = KFOL.showMsg('<strong>{0}{1}</strong>{2}{3}'
                            .replace('{0}', settings.type === 3 ?
                                '成功进行了<em>{0}</em>次试探攻击'.replace('{0}', successNum)
                                : '共有<em>{0}</em>次攻击成功'.replace('{0}', successNum))
                            .replace('{1}', extraMsg)
                            .replace('{2}', msgStat)
                            .replace('{3}', settings.type >= 2 ? '<a href="#">查看日志</a>' : '')
                            , Config.defShowMsgDuration
                        );

                        if (isStop || settings.type === 2 || count >= Const.maxAttackNum) {
                            Tools.setCookie(Const.autoAttackingCookieName, '', Tools.getDate('-1d'));
                            Tools.setCookie(Const.autoAttackReadyCookieName, '', Tools.getDate('-1d'));
                            if (Config.attemptAttackEnabled) {
                                Tools.setCookie(Const.checkLifeCookieName, '', Tools.getDate('-1d'));
                                Tools.setCookie(Const.attackCountCookieName, '', Tools.getDate('-1d'));
                                Tools.setCookie(Const.prevAttemptAttackLogCookieName, '', Tools.getDate('-1d'));
                            }
                        }
                        else if (settings.type === 3) {
                            var attackCount = parseInt(Tools.getCookie(Const.attackCountCookieName));
                            if (isNaN(attackCount) || attackCount < 0) attackCount = 0;
                            attackCount++;
                            if (attackCount >= Const.maxAttackNum) {
                                Tools.setCookie(Const.autoAttackReadyCookieName, '', Tools.getDate('-1d'));
                                Tools.setCookie(Const.prevAttemptAttackLogCookieName, '', Tools.getDate('-1d'));
                            }
                            else {
                                Tools.setCookie(Const.attackCountCookieName, attackCount, new Date(Loot.getNextLootAwardTime().time));
                                if (options.recentMonsterAttackLog) {
                                    var thisGainKfb = 0;
                                    if (gain['夺取KFB']) thisGainKfb = gain['夺取KFB'];
                                    Tools.setCookie(Const.prevAttemptAttackLogCookieName,
                                        (thisGainKfb + options.life) + '/' + options.recentMonsterAttackLog,
                                        new Date(Loot.getNextLootAwardTime().time)
                                    );
                                }
                            }
                        }
                        if (settings.type >= 2) {
                            $msg.find('a:last').click(function (e) {
                                e.preventDefault();
                                Loot.showAttackLogDialog(1, attackLogList, resultStat);
                            });
                            if (settings.type === 2 && KFOL.isInHomePage) {
                                $('a.indbox5[href="kf_fw_ig_index.php"]').removeClass('indbox5').addClass('indbox6');
                            }
                        }
                        else {
                            var $result = $('.pd_result:last');
                            $result.append('<div class="pd_stat"><b>统计结果{0}：</b><br />{1}</div>'
                                .replace('{0}', extraMsg)
                                .replace('{1}', resultStat ? resultStat : '无')
                            );
                            if (Config.customMonsterNameEnabled && !$.isEmptyObject(Config.customMonsterNameList)) {
                                $('<label><input class="pd_input" type="radio" name="pd_custom_attack_log" value="ori" /> 原版</label>' +
                                    '<label style="margin-left:7px"><input class="pd_input" type="radio" name="pd_custom_attack_log" value="custom" checked="checked" />' +
                                    ' 自定义</label><br />')
                                    .prependTo($result)
                                    .find('input[name="pd_custom_attack_log"]')
                                    .click(function () {
                                        if ($(this).val() === 'custom') {
                                            $result.find('ul').html(customHtml);
                                        }
                                        else {
                                            $result.find('ul').html(oriHtml);
                                        }
                                    });
                            }
                        }

                        if (Config.autoUseItemEnabled && Config.autoUseItemNames.length > 0 && typeof gain['item'] !== 'undefined') {
                            var itemNameList = {};
                            for (var itemName in gain['item']) {
                                if ($.inArray(itemName, Config.autoUseItemNames) > -1) {
                                    itemNameList[itemName] = gain['item'][itemName];
                                }
                            }
                            if (!$.isEmptyObject(itemNameList)) Loot.useItemsAfterBatchAttack(itemNameList);
                        }
                        Func.run('Loot.batchAttack_after_', gain);
                    }
                    else {
                        if (isRetakeSafeId) {
                            isRetakeSafeId = false;
                            console.log('重新获取SafeID Start');
                            $.get('kf_fw_ig_index.php?t=' + new Date().getTime(), function (html) {
                                var safeIdMatches = /<a href="kf_fw_card_pk\.php\?safeid=(\w+)">/i.exec(html);
                                var safeId = '';
                                if (safeIdMatches) safeId = safeIdMatches[1];
                                if (!safeId) return;
                                settings.safeId = safeId;
                                if (Tools.getCookie(Const.autoAttackReadyCookieName))
                                    Tools.setCookie(Const.autoAttackReadyCookieName, '2|' + safeId, new Date(Loot.getNextLootAwardTime().time));
                                $(document).dequeue('BatchAttack');
                            }, 'html');
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('BatchAttack');
                            }, typeof Const.perAttackInterval === 'function' ? Const.perAttackInterval() : Const.perAttackInterval);
                        }
                    }
                },
                dataType: 'html'
            });
        };

        $(document).clearQueue('BatchAttack');
        $.each(settings.attackList, function (id, num) {
            $.each(new Array(num), function () {
                $(document).queue('BatchAttack', function () {
                    attack(parseInt(id));
                });
            });
        });
        $(document).dequeue('BatchAttack');
    },

    /**
     * 添加批量攻击按钮
     */
    addBatchAttackButton: function () {
        var safeId = KFOL.getSafeId();
        if (!safeId) return;
        $('.kf_fw_ig1 > tbody > tr:gt(3) > td > a.kfigpk_hit').each(function () {
            var $this = $(this);
            var hitId = parseInt($this.attr('hitid'));
            if (!hitId) return;
            $this.parent().attr('colspan', '3')
                .after(('<td class="pd_batch_attack" style="text-align:center"><label>' +
                    '<input style="width:15px" class="pd_input" type="text" maxlength="2" data-id="{0}" value="{1}" /> 次</label></td>')
                    .replace('{0}', hitId)
                    .replace('{1}', Config.batchAttackList[hitId] ? Config.batchAttackList[hitId] : '')
                );
        });
        $('.pd_batch_attack .pd_input').keydown(function (e) {
            if (e.keyCode === 13) {
                $('.pd_item_btns > button:last-child').click();
            }
        });

        /**
         * 获取攻击列表和总次数
         * @param {{}} attackList 攻击目标列表
         * @returns {number} 攻击总次数
         */
        var getAttackNum = function (attackList) {
            var totalAttackNum = 0;
            $('.pd_batch_attack .pd_input').each(function () {
                var $this = $(this);
                var attackNum = $.trim($this.val());
                if (!attackNum) return 0;
                attackNum = parseInt(attackNum);
                if (isNaN(attackNum) || attackNum < 0) {
                    alert('攻击次数格式不正确');
                    $this.select();
                    $this.focus();
                    return 0;
                }
                attackList[parseInt($this.data('id'))] = attackNum;
                totalAttackNum += attackNum;
            });
            if ($.isEmptyObject(attackList)) return 0;
            if (totalAttackNum > Const.maxAttackNum) {
                alert('攻击次数不得超过{0}次'.replace('{0}', Const.maxAttackNum));
                return 0;
            }
            return totalAttackNum;
        };

        $('<div class="pd_item_btns"><button>保存设置</button><button>清除设置</button><button><b>批量攻击</b></button></div>')
            .insertAfter('.kf_fw_ig1')
            .find('button:first-child')
            .click(function () {
                var attackList = {};
                var totalAttackNum = getAttackNum(attackList);
                if (totalAttackNum == 0) return;
                ConfigMethod.read();
                Config.batchAttackList = attackList;
                ConfigMethod.write();
                alert('设置已保存');
            })
            .next()
            .click(function () {
                ConfigMethod.read();
                Config.batchAttackList = {};
                ConfigMethod.write();
                alert('设置已清除');
            })
            .next()
            .click(function () {
                KFOL.removePopTips($('.pd_pop_tips'));
                var attackList = {};
                var totalAttackNum = getAttackNum(attackList);
                if (!totalAttackNum) return;
                if (!window.confirm('准备进行{0}次批量攻击，是否开始攻击？'.replace('{0}', totalAttackNum))) return;
                KFOL.showWaitMsg(
                    ('<strong>正在批量攻击中，请耐心等待...</strong><i>攻击次数：<em id="pd_remaining_num">{0}</em></i>' +
                    '<a target="_blank" href="/">浏览其它页面</a><a class="pd_stop_action pd_highlight" href="#">停止操作</a>')
                        .replace('{0}', totalAttackNum)
                    , true);
                Loot.batchAttack({type: 1, totalAttackNum: totalAttackNum, attackList: attackList, safeId: safeId});
            });
    },

    /**
     * 在争夺首页进行对页面元素进行相关处理
     */
    handleInLootIndexPage: function () {
        var $btn = $('input[name="submit1"][value="已经可以领取KFB，请点击这里获取"]');
        if ($btn.length > 0) {
            if (Config.autoLootEnabled && Tools.getCookie(Const.getLootAwardCookieName)) {
                $btn.prop('disabled', true);
                Tools.setCookie(Const.getLootAwardCookieName, '', Tools.getDate('-1d'));
                Loot.getLootAward();
            }
            else {
                $('form[name="rvrc1"]').submit(function () {
                    var gain = parseInt($btn.parent('td').find('span:eq(0)').text());
                    if (!isNaN(gain) && gain >= 0) {
                        var nextTime = Tools.getDate('+' + Const.defLootInterval + 'm').getTime() + 10 * 1000;
                        Tools.setCookie(Const.getLootAwardCookieName, '2|' + nextTime, new Date(nextTime));
                        Log.push('领取争夺奖励', '领取争夺奖励', {gain: {'KFB': gain}});
                    }
                });
            }
        }

        var $submit = $('input[name="submit1"][value$="领取，点击这里抢别人的"]');
        if ($submit.length > 0) {
            (function () {
                var timeLog = Loot.getNextLootAwardTime();
                if (timeLog.type >= 1) {
                    var diff = Tools.getTimeDiffInfo(timeLog.time);
                    if (diff.hours === 0 && diff.minutes === 0 && diff.seconds === 0) return;
                    var matches = /还有(\d+)小时领取，点击这里抢别人的/.exec($submit.val());
                    if (timeLog.type === 2 && matches) {
                        if (matches) {
                            if (diff.hours !== parseInt(matches[1])) return;
                            $submit.css('width', '270px').val('还有{0}小时{1}分领取，点击这里抢别人的'.replace('{0}', diff.hours).replace('{1}', diff.minutes));
                        }
                        else {
                            if (diff.hours !== 0) return;
                        }
                    }
                    var end1 = new Date(timeLog.time);
                    var end2 = new Date(timeLog.time + 60 * 60 * 1000);
                    $submit.prev().prev().before('<span class="pd_highlight">可领取时间：{0} {1}{2}</span>'
                        .replace('{0}', Tools.getDateString(end1))
                        .replace('{1}', Tools.getTimeString(end1, ':', false))
                        .replace('{2}', timeLog.type === 1 ? '~' + Tools.getTimeString(end2, ':', false) : '')
                    );
                }
            }());
        }

        if (Tools.getCookie(Const.checkLifeCookieName)) {
            var value = Tools.getCookie(Const.prevAttemptAttackLogCookieName);
            if (value) {
                var arr = value.split('/');
                if (arr.length === 2 && !isNaN(parseInt(arr[0]))) {
                    var realLife = parseInt(arr[0]);
                    var prevMonsterAttackLog = $.trim(arr[1]);
                    var recentMonsterAttackLogTime = '';
                    var attackLogMatches = />(\d+:\d+:\d+)\s*\|/.exec($('.kf_fw_ig1 > tbody > tr:nth-child(3) > td:first-child').html());
                    if (attackLogMatches) recentMonsterAttackLogTime = attackLogMatches[1];

                    var $lifeNode = $('.kf_fw_ig1 > tbody > tr:nth-child(2) > td:first-child');
                    var text = $lifeNode.text();
                    var life = 0, minLife = 0;
                    var lifeMatches = /当前拥有\s*(\d+)\s*预领KFB/i.exec(text);
                    if (lifeMatches) life = parseInt(lifeMatches[1]);
                    var minLifeMatches = /则你可以领取(\d+)KFB\)/i.exec(text);
                    if (minLifeMatches) minLife = parseInt(minLifeMatches[1]);
                    if (minLife > 0 && life === minLife && recentMonsterAttackLogTime && prevMonsterAttackLog.indexOf(recentMonsterAttackLogTime) === 0) {
                        $lifeNode.find('br:first').before(
                            '<span class="pd_custom_tips" style="color:#339933" title="当前实际生命值（在少数情况下可能会不准确）"> (生命值：<b>{0}</b>)</span>'
                                .replace('{0}', realLife)
                        );
                    }
                }
            }
        }

        var $lootPropertyInfo = $('.kf_fw_ig1 > tbody > tr:nth-child(2) > td:nth-child(2)');
        if ($lootPropertyInfo.length > 0) {
            var html = $lootPropertyInfo.html();
            var lootInfoMatches = html.match(/>.+?\s*\d+\(\+\d+(\+\d+)?\)\s*(点|%)<\/span>/gi);
            if (lootInfoMatches) {
                for (var i in lootInfoMatches) {
                    var lineMatches = /(\d+)\(\+(\d+)(\+\d+)?\)/.exec(lootInfoMatches[i]);
                    if (!lineMatches) continue;
                    var totalNum = 0;
                    for (var j = 1; j < lineMatches.length; j++) {
                        var num = parseInt(lineMatches[j]);
                        if (isNaN(num)) continue;
                        totalNum += num;
                    }
                    if (totalNum > 0) {
                        var replace = lootInfoMatches[i].replace(lineMatches[0], lineMatches[0] + '=' + totalNum);
                        html = html.replace(lootInfoMatches[i], replace);
                    }
                }
                $lootPropertyInfo.html(html);
            }
            $lootPropertyInfo.find('span[title]').addClass('pd_custom_tips');

            $lootPropertyInfo.css('position', 'relative');
            $('<a style="position:absolute;top:4px;right:5px;" href="#">[合计]</a>').appendTo($lootPropertyInfo).click(function (e) {
                e.preventDefault();
                var $this = $(this);
                var $panel = $('#pd_attack_sum_panel');
                if ($panel.length > 0) {
                    $this.text('[合计]');
                    $panel.remove();
                    return;
                }
                $this.text('[关闭]');

                var attackNum = 0, attackBurnNum = 0, strongAttackPercent = 0;
                var content = $lootPropertyInfo.html();
                var matches = /争夺攻击\s*\d+\(\+\d+\)=(\d+)\s*点/.exec(content);
                if (matches) attackNum = parseInt(matches[1]);
                matches = /争夺燃烧\s*\d+\(\+\d+\)=(\d+)\s*点/.exec(content);
                if (matches) attackBurnNum = parseInt(matches[1]);
                matches = /争夺暴击比例\s*\d+\(\+\d+\)=(\d+)\s*%/.exec(content);
                if (matches) strongAttackPercent = parseInt(matches[1]) / 100;

                var html =
                    '<table class="pd_panel" id="pd_attack_sum_panel" style="text-align:center;padding:0 5px">' +
                    '  <tbody>' +
                    '    <tr>' +
                    '      <th style="width:95px;text-align:left">攻击|攻击+燃烧</th>' +
                    '      <th style="width:120px">正常</th>' +
                    '      <th style="width:120px">致命一击(如果有)</th>' +
                    '    </tr>' +
                    '    <tr>' +
                    '      <th style="text-align:left">普通攻击</th>' +
                    '      <td class="pd_custom_tips" title="争夺攻击+争夺燃烧">{0} | <span class="pd_highlight">{1}</span></td>'
                        .replace('{0}', attackNum)
                        .replace('{1}', attackNum + attackBurnNum) +
                    '      <td class="pd_custom_tips" title="争夺攻击×致命一击比例+争夺燃烧">{0} | <span class="pd_highlight">{1}</span></td>'
                        .replace('{0}', Math.round(attackNum * Const.deadlyAttackPercent))
                        .replace('{1}', Math.round(attackNum * Const.deadlyAttackPercent) + attackBurnNum) +
                    '    </tr>' +
                    '    <tr>' +
                    '      <th style="text-align:left">暴击(如果有)</th>' +
                    '      <td class="pd_custom_tips" title="争夺攻击×暴击比例+争夺燃烧">{0} | <span class="pd_highlight">{1}</span></td>'
                        .replace('{0}', Math.round(attackNum * strongAttackPercent))
                        .replace('{1}', Math.round(attackNum * strongAttackPercent) + attackBurnNum) +
                    '      <td class="pd_custom_tips" title="争夺攻击×致命一击比例×暴击比例+争夺燃烧">{0} | <span class="pd_highlight">{1}</span></td>'
                        .replace('{0}', Math.round(Math.round(attackNum * Const.deadlyAttackPercent) * strongAttackPercent))
                        .replace('{1}', Math.round(Math.round(attackNum * Const.deadlyAttackPercent) * strongAttackPercent) + attackBurnNum) +
                    '    </tr>' +
                    '  </tbody>' +
                    '</table>';
                var offset = $lootPropertyInfo.offset();
                $panel = $(html).appendTo('body');
                $panel.css('top', offset.top - $panel.height() - 2).css('left', offset.left);
            });
        }

        var prevLootInfo = Loot.getPrevLootInfo();
        if (prevLootInfo) {
            var $lootInfo = $('.kf_fw_ig1 > tbody > tr:nth-child(2) > td:nth-child(3)');
            var html = $lootInfo.html();
            var lootInfo = Loot.getLootInfo(html);
            if (lootInfo) {
                var lootCountDiff = lootInfo.lootCount - prevLootInfo.lootCount;
                if (lootCountDiff === 1) {
                    var attackCountDiff = lootInfo.attackCount - prevLootInfo.attackCount,
                        attackKfbDiff = lootInfo.attackKfb - prevLootInfo.attackKfb,
                        attackedCountDiff = lootInfo.attackedCount - prevLootInfo.attackedCount,
                        attackedKfbDiff = lootInfo.attackedKfb - prevLootInfo.attackedKfb;
                    if (attackCountDiff >= 0 && attackKfbDiff >= 0 && attackedCountDiff >= 0 && attackedKfbDiff >= 0) {
                        $lootInfo.html(
                            html.replace(/(总计争夺\s*\d+\s*次)/i, '$1 <span class="pd_custom_tips" title="本回合目前攻击的次数">({0} 次)</span>'.replace('{0}', attackCountDiff))
                                .replace(/(总计争夺\s*\d+\s*KFB)/i, '$1 <span class="pd_custom_tips" title="本回合目前夺取的KFB">({0} KFB)</span>'.replace('{0}', attackKfbDiff))
                                .replace(/(总计被争夺\s*\d+\s*次)/i, '$1 <span class="pd_custom_tips" title="本回合目前被攻击的次数">({0} 次)</span>'.replace('{0}', attackedCountDiff))
                                .replace(/(总计被争夺\s*\d+\s*KFB)/i, '$1 <span class="pd_custom_tips" title="本回合目前被夺取的KFB（不包括被燃烧的KFB）">({0} KFB)</span>'.replace('{0}', attackedKfbDiff))
                        ).find('.pd_custom_tips').css('color', '#339933');
                    }
                }
            }
        }
    },

    /**
     * 获取下次领取争夺奖励的时间对象
     * @returns {{type: number, time: number}} 下次领取争夺奖励的时间对象，type：时间类型（0：获取失败；1：估计时间；2：精确时间）；time：下次领取时间
     */
    getNextLootAwardTime: function () {
        var log = Tools.getCookie(Const.getLootAwardCookieName);
        if (log) {
            log = log.split('|');
            if (log.length === 2) {
                var type = parseInt(log[0]);
                var time = parseInt(log[1]);
                if (!isNaN(type) && !isNaN(time) && type > 0 && time > 0) {
                    return {type: parseInt(type), time: parseInt(time)};
                }
            }
        }
        return {type: 0, time: 0};
    },

    /**
     * 判断当前是否可以自动攻击
     * @returns {boolean} 是否可以自动攻击
     */
    isAutoAttackNow: function () {
        if (!Config.attackAfterTime) return true;
        var timeLog = Loot.getNextLootAwardTime();
        if (timeLog.type > 0) {
            var end = timeLog.time - Config.attackAfterTime * 60 * 1000;
            return end <= new Date().getTime();
        }
        else return false;
    },

    /**
     * 检查自动攻击是否已完成
     */
    checkAutoAttack: function () {
        var value = Tools.getCookie(Const.autoAttackReadyCookieName);
        if (!value) return;
        var valueArr = value.split('|');
        if (valueArr.length !== 2) return;
        var type = parseInt(valueArr[0]);
        if (isNaN(type)) return;
        var safeId = valueArr[1];
        if (!safeId) safeId = KFOL.getSafeId();
        if (!safeId) return;
        if (type === 2 && Config.attackAfterTime > 0) {
            if (Loot.isAutoAttackNow())
                Loot.autoAttack(safeId);
            else if (Config.attemptAttackEnabled && !Tools.getCookie(Const.checkLifeCookieName))
                Loot.checkLife();
        }
        else {
            Loot.autoAttack(safeId);
        }
    },

    /**
     * 检查当前生命值
     */
    checkLife: function () {
        Func.run('Loot.checkLife_before_');
        console.log('检查生命值Start');
        $.get('kf_fw_ig_index.php?t=' + new Date().getTime(), function (html) {
            if (Tools.getCookie(Const.checkLifeCookieName)) return;
            if (/本回合剩余攻击次数\s*0\s*次/.test(html)) {
                Tools.setCookie(Const.autoAttackReadyCookieName, '', Tools.getDate('-1d'));
                Tools.setCookie(Const.checkLifeCookieName, '', Tools.getDate('-1d'));
                Tools.setCookie(Const.attackCountCookieName, '', Tools.getDate('-1d'));
                Tools.setCookie(Const.prevAttemptAttackLogCookieName, '', Tools.getDate('-1d'));
            }
            var safeIdMatches = /<a href="kf_fw_card_pk\.php\?safeid=(\w+)">/i.exec(html);
            var safeId = '';
            if (safeIdMatches) safeId = safeIdMatches[1];
            if (!safeId) return;

            var checkLifeInterval = Const.defCheckLifeInterval;
            var lifeMatches = />(\d+)<\/span>\s*预领KFB<br/i.exec(html);
            var minLifeMatches = /你的神秘系数\]，则你可以领取(\d+)KFB\)<br/i.exec(html);
            var life = 0, minLife = 0;
            var isLteMinLife = false;
            if (lifeMatches && minLifeMatches) {
                life = parseInt(lifeMatches[1]);
                minLife = parseInt(minLifeMatches[1]);
                if (life <= minLife) {
                    checkLifeInterval = Const.checkLifeAfterAttemptAttackInterval;
                    isLteMinLife = true;
                }
            }
            var maxCheckAttackLifeNum = Const.maxAttemptAttackLifeNum;
            if (maxCheckAttackLifeNum > minLife || maxCheckAttackLifeNum < 0) maxCheckAttackLifeNum = minLife;
            var recentMonsterAttackLog = '';
            var monsterAttackLogList = Loot.getMonsterAttackLogList(html);
            if (monsterAttackLogList.length > 0) recentMonsterAttackLog = $.trim(monsterAttackLogList[0]);
            if (Const.debug) console.log('最近一次的被攻击日志：' + (recentMonsterAttackLog ? recentMonsterAttackLog : '无'));
            var deadlyAttackNum = 0;
            if (Config.deadlyAttackId > 0) {
                var deadlyAttackMatches = /致命一击剩余攻击次数\s*(\d+)\s*次/i.exec(html);
                if (deadlyAttackMatches) deadlyAttackNum = parseInt(deadlyAttackMatches[1]);
                if (deadlyAttackNum > Const.maxAttackNum) deadlyAttackNum = Const.maxAttackNum;
            }

            /**
             * 写入下次检查生命值的Cookie信息
             * @param {number} life 当前实际生命值
             * @param {number} interval 下次检查生命值的时间间隔（分钟）
             * @param {string} msg 提示消息
             */
            var writeNextCheckLifeCookie = function (life, interval, msg) {
                var nextTime = Tools.getDate('+' + interval + 'm');
                Tools.setCookie(Const.checkLifeCookieName, nextTime.getTime(), nextTime);

                var lootInfo = Loot.getNextLootAwardTime();
                if (lootInfo.time > 0) {
                    console.log('【检查生命值】当前生命值：{0}，低保线：{1}；距本回合开始已经过{3}分钟{4}，下一次检查生命值的时间间隔为{5}分钟\n{6}'
                        .replace('{0}', life)
                        .replace('{1}', minLife)
                        .replace('{2}', maxCheckAttackLifeNum)
                        .replace('{3}', Const.defLootInterval - Math.floor((lootInfo.time - new Date().getTime()) / 60 / 1000))
                        .replace('{4}', lootInfo.type === 1 ? '(估计时间)' : '')
                        .replace('{5}', interval)
                        .replace('{6}', msg)
                    );
                }
            };

            /**
             * 试探攻击
             * @param {number} life 当前实际生命值
             * @param {string} recentMonsterAttackLog 最近一次的被怪物攻击日志
             * @param {string} msg 提示消息
             */
            var attemptAttack = function (life, recentMonsterAttackLog, msg) {
                writeNextCheckLifeCookie(life, checkLifeInterval, msg);
                KFOL.removePopTips($('#pd_remaining_num').closest('.pd_pop_tips'));
                var attackCount = parseInt(Tools.getCookie(Const.attackCountCookieName));
                if (isNaN(attackCount) || attackCount < 0) attackCount = 0;
                var num = 0, attackId = 0;
                for (var id in Config.batchAttackList) {
                    for (var i = 1; i <= Config.batchAttackList[id]; i++) {
                        if (attackCount === num) {
                            attackId = id;
                            break;
                        }
                        num++;
                    }
                    if (attackId > 0) break;
                }
                if (!attackId) return;
                if (deadlyAttackNum > 0) attackId = Config.deadlyAttackId;
                var attackList = {};
                attackList[attackId] = 1;
                KFOL.showWaitMsg('<strong>正在进行试探攻击中...</strong><i>攻击次数：<em id="pd_remaining_num">1</em></i>', true);
                Loot.batchAttack({
                    type: 3,
                    totalAttackNum: 1,
                    attackList: attackList,
                    safeId: safeId,
                    life: life,
                    recentMonsterAttackLog: recentMonsterAttackLog
                });
            };

            if (!isLteMinLife) {
                writeNextCheckLifeCookie(life, checkLifeInterval, '当前生命值大于低保线，不进行试探攻击');
                if (recentMonsterAttackLog)
                    Tools.setCookie(Const.prevAttemptAttackLogCookieName, life + '/' + recentMonsterAttackLog, new Date(Loot.getNextLootAwardTime().time));
                else
                    Tools.setCookie(Const.prevAttemptAttackLogCookieName, '', Tools.getDate('-1d'));
                return;
            }

            var prevCheckAttackInfo = Tools.getCookie(Const.prevAttemptAttackLogCookieName);
            if (prevCheckAttackInfo && recentMonsterAttackLog) {
                var arr = prevCheckAttackInfo.split('/');
                if (arr.length === 2 && $.type(parseInt(arr[0])) === 'number') {
                    var realLife = parseInt(arr[0]), loss = 0;
                    if (realLife < 0) realLife = 0;
                    var prevMonsterAttackLog = $.trim(arr[1]);
                    if (Const.debug) console.log('上次记录的被攻击日志：' + prevMonsterAttackLog);
                    var index = 0;
                    for (; index <= monsterAttackLogList.length; index++) {
                        if ($.trim(monsterAttackLogList[index]) === prevMonsterAttackLog) break;
                        if (/清空生命值/.test(monsterAttackLogList[index])) {
                            attemptAttack(0, recentMonsterAttackLog, '自上次检查生命值以来，在后续的被攻击日志中发现被清空生命值的情况，需要进行试探攻击');
                            return;
                        }
                        var matches = /被实际夺取(\d+)KFB.+被实际燃烧(\d+)KFB/i.exec(monsterAttackLogList[index]);
                        if (matches) loss += parseInt(matches[1]) + parseInt(matches[2]);
                    }
                    realLife -= loss;
                    if (realLife < 0) realLife = 0;
                    if (index > monsterAttackLogList.length) {
                        attemptAttack(0, recentMonsterAttackLog, '在当前被攻击日志中未找到上次记录的被攻击日志，需要进行试探攻击');
                    }
                    else {
                        if (index === 0 && realLife <= maxCheckAttackLifeNum) {
                            attemptAttack(realLife, prevMonsterAttackLog, '当前生命值未超过阈值，继续进行试探攻击');
                        }
                        else {
                            if (realLife > maxCheckAttackLifeNum) {
                                var msg = '';
                                if (recentMonsterAttackLog === prevMonsterAttackLog) msg = '未遭到新的攻击';
                                else msg = '共损失{0}KFB'.replace('{0}', loss);
                                writeNextCheckLifeCookie(realLife,
                                    Const.defCheckLifeInterval,
                                    '自上次检查生命值以来，{0}，生命值高于阈值，暂无试探攻击的必要'.replace('{0}', msg)
                                );
                                Tools.setCookie(Const.prevAttemptAttackLogCookieName,
                                    realLife + '/' + recentMonsterAttackLog,
                                    new Date(Loot.getNextLootAwardTime().time)
                                );
                            }
                            else {
                                attemptAttack(realLife,
                                    recentMonsterAttackLog,
                                    '自上次检查生命值以来，共损失{0}KFB，生命值未超过阈值，需要进行试探攻击'.replace('{0}', loss)
                                );
                            }
                        }
                    }
                }
                else {
                    attemptAttack(0, recentMonsterAttackLog, '未发现检查生命值的记录，需要进行试探攻击');
                }
            }
            else {
                attemptAttack(0, recentMonsterAttackLog, '未发现检查生命值的记录，需要进行试探攻击');
            }
            Func.run('Loot.checkLife_after_', html);
        }, 'html');
    },

    /**
     * 显示批量攻击或被NPC攻击的日志对话框
     * @param {number} type 对话框类型，1：批量攻击日志；2：被NPC攻击日志
     * @param {string[]} logList 攻击日志列表
     * @param {string} [stat] 批量攻击收获
     */
    showAttackLogDialog: function (type, logList, stat) {
        if ($('#pd_attack_log').length > 0) return;
        var log = '<li>' + logList.join('</li><li>') + '</li>';
        var strongAttackNum = 0, criticalStrikeNum = 0;
        var matches = log.match(/触发暴击!/g);
        if (matches) strongAttackNum = matches.length;
        matches = log.match(/致命一击!/g);
        if (matches) criticalStrikeNum = matches.length;
        var html =
            '<div class="pd_cfg_main">' +
            '<div style="margin-top:5px">' +
            '  <label><input class="pd_input" type="radio" name="pd_custom_attack_log" value="ori" checked="checked" /> 原版</label>' +
            '  <label style="margin-left:7px"><input class="pd_input" type="radio" name="pd_custom_attack_log" value="custom" /> 自定义</label>' +
            '</div>' +
            '  <ul id="pd_attack_log_content"></ul>' +
            '</div>';
        var $dialog = Dialog.create('pd_attack_log', '{0}日志'.replace('{0}', type === 2 ? 'NPC攻击' : '批量攻击'), html);

        /**
         * 显示日志
         * @param {string} log 攻击日志
         */
        var showLog = function (log) {
            var extraLog = '';
            if (strongAttackNum > 0) extraLog += '暴击<em>+{0}</em>'.replace('{0}', strongAttackNum);
            if (criticalStrikeNum > 0) extraLog += (extraLog ? ' ' : '') + '致命一击<em>+{0}</em>'.replace('{0}', criticalStrikeNum);
            if (extraLog) extraLog = '（' + extraLog + '）';
            if (type === 1) {
                log += '<li class="pd_stat" style="margin-top:10px"><b>统计结果{0}：</b><br />{1}</li>'
                    .replace('{0}', extraLog)
                    .replace('{1}', stat ? stat : '无');
            }
            $dialog.find('#pd_attack_log_content').html(log);
        };

        $dialog.find('input[name="pd_custom_attack_log"]').click(function () {
            var content = '';
            if ($(this).val() === 'custom') {
                var customLog = log;
                $.each(Config.customMonsterNameList, function (id, name) {
                    var oriName = Loot.getMonsterNameById(parseInt(id));
                    if (type === 2) {
                        customLog = customLog.replace(
                            new RegExp('\\[{0}\\]对'.replace('{0}', oriName), 'g'),
                            '<span class="pd_custom_tips" title="{0}">[{1}]</span>对'.replace('{0}', oriName).replace('{1}', name)
                        );
                    }
                    else {
                        customLog = customLog.replace(
                            new RegExp('对\\[{0}\\]'.replace('{0}', oriName), 'g'),
                            '对<span class="pd_custom_tips" title="{0}">[{1}]</span>'.replace('{0}', oriName).replace('{1}', name)
                        );
                    }
                });
                content = customLog;
            }
            else {
                content = log;
            }
            showLog(content);
        });

        if (Config.customMonsterNameEnabled && !$.isEmptyObject(Config.customMonsterNameList)) {
            $dialog.find('input[name="pd_custom_attack_log"][value="custom"]')
                .prop('checked', true)
                .triggerHandler('click');
        }
        else {
            $dialog.find('input[name="pd_custom_attack_log"][value="custom"]').prop('disabled', true);
            showLog(log);
        }
        Dialog.show('pd_attack_log');
        $dialog.find('input:first').focus();
    },

    /**
     * 通过怪物ID获取怪物原始名称
     * @param {number} id 怪物ID
     * @returns {string} 怪物原始名称
     */
    getMonsterNameById: function (id) {
        switch (id) {
            case 1:
                return '小史莱姆';
            case 2:
                return '笨蛋';
            case 3:
                return '大果冻史莱姆';
            case 4:
                return '肉山';
            case 5:
                return '大魔王';
            default:
                return '';
        }
    },

    /**
     * 自定义怪物名称
     */
    customMonsterName: function () {
        if ($.isEmptyObject(Config.customMonsterNameList)) return;
        if (location.pathname === '/kf_fw_ig_index.php') {
            var $log = $('.kf_fw_ig1 > tbody > tr:nth-last-child(2) > td');
            var oriLog = $log.html();
            if (!$.trim(oriLog)) return;
            $log.wrapInner('<div></div>');
            $('<label><input class="pd_input" type="radio" name="pd_custom_attack_log" value="ori" /> 原版</label>' +
                '<label style="margin-left:7px"><input class="pd_input" type="radio" name="pd_custom_attack_log" value="custom" checked="checked" /> 自定义</label><br />')
                .prependTo($log)
                .find('input[name="pd_custom_attack_log"]')
                .click(function () {
                    if ($(this).val() === 'custom') {
                        var customLog = oriLog;
                        $.each(Config.customMonsterNameList, function (id, name) {
                            var oriName = Loot.getMonsterNameById(parseInt(id));
                            customLog = customLog.replace(
                                new RegExp('\\[{0}\\]对'.replace('{0}', oriName), 'g'),
                                '<span class="pd_custom_tips" title="{0}">[{1}]</span>对'.replace('{0}', oriName).replace('{1}', name)
                            );
                        });
                        $log.find('div:last-child').html(customLog);
                    }
                    else {
                        $log.find('div:last-child').html(oriLog);
                    }
                })
                .end()
                .find('input[value="custom"]')
                .triggerHandler('click');
        }
        else if (/\/kf_fw_ig_pklist\.php(\?l=s)?$/i.test(location.href)) {
            $('.kf_fw_ig1 > tbody > tr:gt(2):nth-child(3n+1) > td:first-child').each(function () {
                var $this = $(this);
                var html = $this.html();
                $.each(Config.customMonsterNameList, function (id, name) {
                    var oriName = Loot.getMonsterNameById(parseInt(id));
                    html = html.replace(oriName, '<span class="pd_custom_tips" title="{0}">{1}</span>'.replace('{0}', oriName).replace('{1}', name));
                });
                $this.html(html);
            });
            $('a.kfigpk_hit').each(function () {
                var $this = $(this);
                var html = $this.html();
                $.each(Config.customMonsterNameList, function (id, name) {
                    html = html.replace(Loot.getMonsterNameById(parseInt(id)), name);
                });
                $this.html(html);
            });
            $(function () {
                $('a.kfigpk_hit').off('click').click(function () {
                    var $this = $(this);
                    $.post('kf_fw_ig_pkhit.php',
                        {uid: $this.attr('hitid'), safeid: $this.attr('safeid')},
                        function (msg) {
                            $.each(Config.customMonsterNameList, function (id, name) {
                                msg = msg.replace(
                                    '对[{0}]'.replace('{0}', Loot.getMonsterNameById(parseInt(id))),
                                    '对[{0}]'.replace('{0}', name)
                                );
                            });
                            $this.html(msg);
                        }, 'html');
                });
            });
        }
    },

    /**
     * 获取争夺属性列表
     * @param {string} html 争夺首页的HTML代码
     * @returns {{}} 争夺属性列表
     */
    getLootPropertyList: function (html) {
        var lootPropertyList = {
            '剩余攻击次数': 0,
            '致命一击剩余攻击次数': 0,
            '争夺攻击': 0,
            '神秘系数': 0,
            '争夺燃烧': 0,
            '争夺暴击几率': 0,
            '争夺暴击比例': 0,
            '命中': 0,
            '闪避': 0,
            '防御': 0,
            '道具使用列表': {}
        };
        var itemUsedNumList = {'蕾米莉亚同人漫画': 0, '十六夜同人漫画': 0, '档案室钥匙': 0, '傲娇LOLI娇蛮音CD': 0, '整形优惠卷': 0, '消逝之药': 0};

        var matches = /本回合剩余攻击次数\s*(\d+)\s*次/.exec(html);
        if (matches) lootPropertyList['剩余攻击次数'] = parseInt(matches[1]);

        matches = /致命一击剩余攻击次数\s*(\d+)\s*次/.exec(html);
        if (matches) lootPropertyList['致命一击剩余攻击次数'] = parseInt(matches[1]);

        matches = /争夺攻击\s*(\d+)\(\+(\d+)\)\s*点/.exec(html);
        if (matches) {
            lootPropertyList['争夺攻击'] = parseInt(matches[1]) + parseInt(matches[2]);
            lootPropertyList['神秘系数'] = parseInt(matches[2]);
        }

        matches = /争夺燃烧\s*(\d+)\(\+(\d+)\)\s*点/.exec(html);
        if (matches) {
            lootPropertyList['争夺燃烧'] = parseInt(matches[1]) + parseInt(matches[2]);
            itemUsedNumList['蕾米莉亚同人漫画'] = parseInt(matches[2]);
        }

        matches = /争夺暴击几率\s*(\d+)\s*%/.exec(html);
        if (matches) {
            lootPropertyList['争夺暴击几率'] = parseInt(matches[1]);
            itemUsedNumList['整形优惠卷'] = Math.floor(parseInt(matches[1]) / 3);
        }

        matches = /争夺暴击比例\s*(\d+)\(\+(\d+)\)\s*%/.exec(html);
        if (matches) {
            lootPropertyList['争夺暴击比例'] = parseInt(matches[1]) + parseInt(matches[2]);
            itemUsedNumList['档案室钥匙'] = Math.floor(parseInt(matches[2]) / 10);
        }

        matches = /命中\s*(\d+)\(\+(\d+)\+(\d+)\)\s*点/.exec(html);
        if (matches) {
            lootPropertyList['命中'] = parseInt(matches[1]) + parseInt(matches[2]) + parseInt(matches[3]);
            itemUsedNumList['傲娇LOLI娇蛮音CD'] = parseInt(matches[3]);
        }

        matches = /闪避\s*(\d+)\(\+(\d+)\+(\d+)\)\s*点/.exec(html);
        if (matches) {
            lootPropertyList['闪避'] = parseInt(matches[1]) + parseInt(matches[2]) + parseInt(matches[3]);
            itemUsedNumList['十六夜同人漫画'] = parseInt(matches[2]);
        }

        matches = /防御\s*(\d+)\s*%/.exec(html);
        if (matches) {
            lootPropertyList['防御'] = parseInt(matches[1]);
            itemUsedNumList['消逝之药'] = Math.floor(parseInt(matches[1]) / 7);
        }

        lootPropertyList['道具使用列表'] = itemUsedNumList;
        return lootPropertyList;
    },

    /**
     * 添加怪物争夺信息的提示
     */
    addMonsterLootInfoTips: function () {
        $.get('kf_fw_ig_index.php?t=' + new Date().getTime(), function (html) {
            var lootPropertyList = Loot.getLootPropertyList(html);
            $('.kf_fw_ig1 > tbody > tr').each(function (index) {
                var $this = $(this);
                if (index === 0) {
                    $this.find('td').append(
                        ('<span style="color:#FFF;margin-left:7px;font-weight:normal;font-size:12px">' +
                        '(本回合剩余攻击次数 <b style="font-size:14px">{0}</b> 次，致命一击剩余次数 <b style="font-size:14px">{1}</b> 次)</span>')
                            .replace('{0}', lootPropertyList['剩余攻击次数'])
                            .replace('{1}', lootPropertyList['致命一击剩余攻击次数'])
                    );
                    return;
                }
                if (index === 1 || $this.children('td').length !== 4) return;
                $this.children('td:gt(0)').each(function (index) {
                    var $this = $(this);
                    var html = $this.html();
                    if (index === 0) {
                        var matches = /(\d+)生命值\s*\|\s*(\d+)闪避\s*\|\s*\((\d+)x(\d+)\)%防御/.exec(html);
                        if (!matches) return;
                        var life = parseInt(matches[1]), avoid = parseInt(matches[2]), defense = parseInt(matches[3]) * parseInt(matches[4]) / 100;

                        var clearLife = false;
                        var tipsClassName = '';
                        if (life <= Math.round(lootPropertyList['争夺攻击'] * (1 - defense)) + lootPropertyList['争夺燃烧']) {
                            clearLife = true;
                            tipsClassName = 'pd_verify_tips_ok';
                        }
                        else {
                            if (life <= Math.round(Math.round(lootPropertyList['争夺攻击'] * Const.deadlyAttackPercent) * (1 - defense)) + lootPropertyList['争夺燃烧'])
                                clearLife = true;
                            else if (life <= Math.round(Math.round(lootPropertyList['争夺攻击'] * lootPropertyList['争夺暴击比例'] / 100) * (1 - defense))
                                + lootPropertyList['争夺燃烧']
                            )
                                clearLife = true;
                            else if (life <= Math.round(Math.round(Math.round(lootPropertyList['争夺攻击'] * Const.deadlyAttackPercent)
                                        * lootPropertyList['争夺暴击比例'] / 100) * (1 - defense)) + lootPropertyList['争夺燃烧']
                            )
                                clearLife = true;
                            if (clearLife) tipsClassName = 'pd_verify_tips_conditional';
                            else tipsClassName = 'pd_verify_tips_unable';
                        }
                        var lifeTips = '<span class="pd_verify_tips pd_verify_tips_details" data-life="{0}" data-defense="{1}">[<b class="{2}">{3}</b>]</span>'
                            .replace('{0}', life)
                            .replace('{1}', defense)
                            .replace('{2}', tipsClassName)
                            .replace('{3}', clearLife ? '&#10003;' : '&times;');
                        html = html.replace('生命值', '生命值' + lifeTips);

                        var avoidTips = '';
                        if (avoid <= lootPropertyList['命中']) {
                            avoidTips = '<span class="pd_verify_tips" title="攻击此怪物可100%命中">[<b class="pd_verify_tips_ok">&#10003;</b>]</span>';
                        }
                        else {
                            avoidTips = '<span class="pd_verify_tips" title="攻击此怪物有40%的几率命中（还差{0}点可100%命中）">[<b class="pd_verify_tips_unable">&times;</b>]</span>'
                                .replace('{0}', avoid - lootPropertyList['命中']);
                        }
                        html = html.replace('闪避', '闪避' + avoidTips);

                        $this.html(html);
                    }
                    else if (index === 1) {
                        matches = /(\d+)攻击\s*\|\s*(\d+)燃烧\s*\|\s*(\d+)命中.+?(\((\d+)%\+(\d+)x(\d+)%\)暴击伤害)/.exec(html);
                        if (!matches) return;
                        var attack = parseInt(matches[1]), burn = parseInt(matches[2]), hit = parseInt(matches[3]);
                        var strongAttackText = matches[4];
                        var strongAttackPercent = parseInt(matches[5]) + Math.round(parseInt(matches[6]) * parseInt(matches[7]));

                        var attackTips = '<span class="pd_custom_tips" title="可实际夺取{0}KFB">{1}攻击</span>'
                            .replace('{0}', Math.round(attack * (100 - lootPropertyList['防御']) / 100))
                            .replace('{1}', attack);
                        html = html.replace(attack + '攻击', attackTips);

                        var burnTips = '<span class="pd_custom_tips" title="实际夺取KFB+燃烧KFB={0}KFB">{1}燃烧</span>'
                            .replace('{0}', Math.round(attack * (100 - lootPropertyList['防御']) / 100) + burn)
                            .replace('{1}', burn);
                        html = html.replace(burn + '燃烧', burnTips);

                        var htiTips = '';
                        if (hit < lootPropertyList['闪避']) {
                            htiTips = '<span class="pd_verify_tips" title="有60%的几率可闪避此怪物的攻击">[<b class="pd_verify_tips_ok">&#10003;</b>]</span>';
                        }
                        else {
                            htiTips = '<span class="pd_verify_tips" title="无法闪避此怪物的攻击（还差{0}点可全部闪避）">[<b class="pd_verify_tips_unable">&times;</b>]</span>'
                                .replace('{0}', hit - lootPropertyList['闪避'] + 1);
                        }
                        html = html.replace('命中', '命中' + htiTips);

                        var strongAttackTips = '<span class="pd_custom_tips" title="暴击可实际夺取{0}KFB">{1}</span>'
                            .replace('{0}', Math.round(Math.round(attack * strongAttackPercent / 100) * (100 - lootPropertyList['防御']) / 100))
                            .replace('{1}', strongAttackText);
                        html = html.replace(strongAttackText, strongAttackTips);

                        $this.html(html);
                    }
                    else if (index === 2) {
                        var itemDropPercent = parseInt($.trim($this.text()));
                        if (isNaN(itemDropPercent)) return;
                        $this.addClass('pd_custom_tips').attr('title', '在20次攻击中预计可掉落{0}个道具'.replace('{0}', (itemDropPercent / 100 * 20).toFixed(1)));
                    }
                });
            });

            $(document).on('click', '.pd_verify_tips_details[data-life]', function () {
                var $this = $(this);
                var life = parseInt($this.data('life'));
                if (isNaN(life)) return;
                var defense = parseFloat($this.data('defense'));
                if (isNaN(defense)) return;
                var $panel = $('#pd_monster_loot_info_panel');
                if ($panel.length > 0) $panel.remove();

                var tipsList = new Array(4);
                for (var i = 0; i < tipsList.length; i++) {
                    var attack = 0, burn = lootPropertyList['争夺燃烧'], totalAttack = 0;
                    switch (i) {
                        case 0:
                            attack = Math.round(lootPropertyList['争夺攻击'] * (1 - defense));
                            break;
                        case 1:
                            attack = Math.round(Math.round(lootPropertyList['争夺攻击'] * Const.deadlyAttackPercent) * (1 - defense));
                            break;
                        case 2:
                            attack = Math.round(Math.round(lootPropertyList['争夺攻击'] * lootPropertyList['争夺暴击比例'] / 100) * (1 - defense));
                            break;
                        case 3:
                            attack = Math.round(Math.round(Math.round(lootPropertyList['争夺攻击'] * Const.deadlyAttackPercent)
                                    * lootPropertyList['争夺暴击比例'] / 100) * (1 - defense));
                            break;
                    }
                    totalAttack = attack + burn;

                    var attackOverflow = attack - life;
                    if (attackOverflow < 0) attackOverflow = 0;
                    var burnOverflow = totalAttack - life;
                    if (burnOverflow < 0) burnOverflow = 0;
                    else if (burnOverflow > lootPropertyList['争夺燃烧']) burnOverflow = lootPropertyList['争夺燃烧'];
                    var totalAttackOverflow = totalAttack - life;

                    tipsList[i] = ('<em title="夺取KFB">{0}</em>{1} | <em style="font-weight:bold" title="夺取KFB+燃烧KFB">{2}</em>' +
                    ' (<em {3}>{4}</em>)')
                        .replace('{0}', attack <= life ? attack : life)
                        .replace('{1}', attackOverflow > 0 || burnOverflow > 0 ?
                            ' (<em style="color:#0099CC" title="夺取KFB溢出">+{0}</em>'.replace('{0}', attackOverflow) +
                            ' <em style="color:#FF0033" title="燃烧KFB溢出">+{0}</em>)'.replace('{0}', burnOverflow)
                                : ''
                        )
                        .replace('{2}', totalAttack <= life ? totalAttack : life)
                        .replace('{3}', totalAttackOverflow >= 0 ? 'style="color:#CC3399" title="总溢出"' : 'style="color:#339933" title="距清空生命值的差额"')
                        .replace('{4}', totalAttackOverflow >= 0 ? '+' + totalAttackOverflow : totalAttackOverflow);
                }

                var html =
                    '<table class="pd_panel" id="pd_monster_loot_info_panel" style="text-align:center;padding:0 5px">' +
                    '  <tbody>' +
                    '    <tr>' +
                    '      <th style="width:87px;text-align:left"></th>' +
                    '      <th style="width:175px">正常</th>' +
                    '      <th style="width:175px">致命一击(如果有)</th>' +
                    '    </tr>' +
                    '    <tr>' +
                    '      <th style="text-align:left">普通攻击</th>' +
                    '      <td>{0}</td>'.replace('{0}', tipsList[0]) +
                    '      <td>{0}</td>'.replace('{0}', tipsList[1]) +
                    '    </tr>' +
                    '    <tr>' +
                    '      <th style="text-align:left">暴击(如果有)</th>' +
                    '      <td>{0}</td>'.replace('{0}', tipsList[2]) +
                    '      <td>{0}</td>'.replace('{0}', tipsList[3]) +
                    '    </tr>' +
                    '  </tbody>' +
                    '</table>';
                var offset = $this.closest('tr').offset();
                $panel = $(html).appendTo('body');
                $panel.css('top', offset.top - $panel.height() - 2).css('left', offset.left);
            }).on('click', function (e) {
                var $target = $(e.target);
                if (!($target.is('.pd_panel') || $target.closest('.pd_panel').length || $target.is('.pd_verify_tips_details')
                    || $target.closest('.pd_verify_tips_details').length)
                ) {
                    $('#pd_monster_loot_info_panel').remove();
                }
            });
        }, 'html');
    },

    /**
     * 获取被怪物攻击日志列表
     * @param {string} html 争夺首页的HTML代码
     * @returns {string[]} 被怪物攻击日志列表
     */
    getMonsterAttackLogList: function (html) {
        var matches = /<tr><td colspan="\d+">\r\n<span style=".+?">(\d+:\d+:\d+ \|.+?)<br \/><\/td><\/tr>/i.exec(html);
        var attackLogList = [];
        if (matches && /发起争夺/.test(matches[1])) {
            attackLogList = matches[1].replace(/<br \/>/ig, '\n').replace(/(<.+?>|<.+?\/>)/g, '').split('\n');
        }
        return attackLogList;
    },

    /**
     * 在批量攻击后使用刚掉落的指定种类ID列表的道具
     * @param {{}} itemNameList 刚掉落的道具名称列表
     */
    useItemsAfterBatchAttack: function (itemNameList) {
        var totalCount = 0;
        for (var k in itemNameList) {
            totalCount++;
        }
        if (!totalCount) return;
        var $getItemListMsg = KFOL.showWaitMsg('正在获取刚掉落道具的信息，请稍后...', true);
        var itemList = [];
        var count = 0;
        $(document).clearQueue('GetItemList');
        $.each(itemNameList, function (itemName, num) {
            var itemTypeId = Item.getItemTypeIdByItemName(itemName);
            if (!itemTypeId) return;
            $(document).queue('GetItemList', function () {
                $.get('kf_fw_ig_my.php?lv={0}&t={1}'.replace('{0}', itemTypeId).replace('{1}', new Date().getTime()), function (html) {
                    count++;
                    var matches = html.match(/<tr><td>.+?<\/td><td>\d+级道具<\/td><td>.+?<\/td><td><a href="kf_fw_ig_my\.php\?pro=\d+">查看详细<\/a><\/td><\/tr>/gi);
                    if (matches) {
                        var totalNum = matches.length - num;
                        if (totalNum < 0) totalNum = 0;
                        for (var i = matches.length - 1; i >= totalNum; i--) {
                            var itemIdMatches = /kf_fw_ig_my\.php\?pro=(\d+)/i.exec(matches[i]);
                            var itemLevelMatches = /<td>(\d+)级道具<\/td>/i.exec(matches[i]);
                            var itemNameMatches = /<tr><td>(.+?)<\/td>/i.exec(matches[i]);
                            itemList.push({
                                itemId: parseInt(itemIdMatches[1]),
                                itemLevel: parseInt(itemLevelMatches[1]),
                                itemTypeId: itemTypeId,
                                itemName: itemNameMatches[1]
                            });
                        }
                    }
                    if (count === totalCount) {
                        KFOL.removePopTips($getItemListMsg);
                        if (itemList.length > 0) {
                            KFOL.showWaitMsg('<strong>正在使用道具中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                                .replace('{0}', itemList.length)
                                , true);
                            useItemList(itemList);
                        }
                    }
                    else {
                        window.setTimeout(function () {
                            $(document).dequeue('GetItemList');
                        }, Const.defAjaxInterval);
                    }
                }, 'html');
            });
        });

        /**
         * 使用指定列表的道具
         * @param {{}[]} itemList 道具列表
         */
        var useItemList = function (itemList) {
            $(document).clearQueue('UseItemList');
            $.each(itemList, function (index, item) {
                $(document).queue('UseItemList', function () {
                    $.ajax({
                        type: 'GET',
                        url: 'kf_fw_ig_doit.php?id={0}&t={1}'.replace('{0}', item.itemId).replace('{1}', new Date().getTime()),
                        success: function (html) {
                            var msgMatches = /<span style=".+?">(.+?)<\/span><br \/><a href=".+?">/i.exec(html);
                            if (msgMatches) {
                                var stat = {'有效道具': 0, '无效道具': 0};
                                var credits = Item.getCreditsViaResponse(msgMatches[1], item.itemTypeId);
                                if (credits !== -1) {
                                    if ($.isEmptyObject(credits)) stat['无效道具']++;
                                    else stat['有效道具']++;
                                    $.each(credits, function (key, credit) {
                                        if (typeof stat[key] === 'undefined')
                                            stat[key] = credit;
                                        else
                                            stat[key] += credit;
                                    });
                                }
                                if (stat['有效道具'] === 0) delete stat['有效道具'];
                                if (stat['无效道具'] === 0) delete stat['无效道具'];
                                if (credits !== -1) {
                                    Log.push('使用道具',
                                        '共有`1`个道具【`Lv.{0}：{1}`】被使用'
                                            .replace('{0}', item.itemLevel)
                                            .replace('{1}', item.itemName),
                                        {
                                            gain: $.extend({}, stat, {'已使用道具': 1}),
                                            pay: {'道具': -1}
                                        }
                                    );
                                }
                                var logStat = '', msgStat = '';
                                for (var creditsType in stat) {
                                    logStat += '，{0}+{1}'
                                        .replace('{0}', creditsType)
                                        .replace('{1}', stat[creditsType]);
                                    msgStat += '<i>{0}<em>+{1}</em></i>'
                                        .replace('{0}', creditsType)
                                        .replace('{1}', stat[creditsType]);
                                }
                                console.log('道具【Lv.{0}：{1}】被使用{2}【{3}】'
                                    .replace('{0}', item.itemLevel)
                                    .replace('{1}', item.itemName)
                                    .replace('{2}', logStat)
                                    .replace('{3}', msgMatches[1])
                                );
                                KFOL.showMsg('道具【<b><em>Lv.{0}</em>{1}</b>】被使用{2}<br /><span style="font-style:italic">{3}</span>'
                                    .replace('{0}', item.itemLevel)
                                    .replace('{1}', item.itemName)
                                    .replace('{2}', msgStat)
                                    .replace('{3}', msgMatches[1])
                                    , Config.defShowMsgDuration);
                            }
                        },
                        complete: function () {
                            var $remainingNum = $('#pd_remaining_num');
                            $remainingNum.text(parseInt($remainingNum.text()) - 1);
                            var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                            if (isStop) $(document).clearQueue('UseItemList');

                            if (isStop || index === itemList.length - 1) {
                                KFOL.removePopTips($('#pd_remaining_num').closest('.pd_pop_tips'));
                            }
                            else {
                                window.setTimeout(function () {
                                    $(document).dequeue('UseItemList');
                                }, typeof Const.specialAjaxInterval === 'function' ? Const.specialAjaxInterval() : Const.specialAjaxInterval);
                            }
                        },
                        dataType: 'html'
                    });
                });
            });
            $(document).dequeue('UseItemList');
        };
        $(document).dequeue('GetItemList');
    },

    /**
     * 获取当前争夺数据信息
     * @param {string} html 争夺首页的HTML代码
     * @returns {?{lootCount: number, lootKfb: number, attackCount: number, attackKfb: number, attackedCount: number, attackedKfb: number}}
     * 当前争夺数据信息
     * lootCount：争夺次数；lootKfb：争夺实际获得的KFB；attackCount：攻击次数；attackKfb：夺取KFB；attackedCount：被攻击次数；attackedKfb：被夺取KFB；
     */
    getLootInfo: function (html) {
        var lootCountMatches = /总计获得\(实际\)KFB\s*(\d+)\s*次/.exec(html),
            lootKfbMatches = /总计获得\(实际\)\s*(\d+)\s*KFB/i.exec(html),
            attackCountMatches = /总计争夺\s*(\d+)\s*次/.exec(html),
            attackKfbMatches = /总计争夺\s*(\d+)\s*KFB/i.exec(html),
            attackedCountMatches = /总计被争夺\s*(\d+)\s*次/.exec(html),
            attackedKfbMatches = /总计被争夺\s*(\d+)\s*KFB/i.exec(html);
        if (lootCountMatches && lootKfbMatches && attackCountMatches && attackKfbMatches && attackedCountMatches && attackedKfbMatches) {
            return {
                lootCount: parseInt(lootCountMatches[1]),
                lootKfb: parseInt(lootKfbMatches[1]),
                attackCount: parseInt(attackCountMatches[1]),
                attackKfb: parseInt(attackKfbMatches[1]),
                attackedCount: parseInt(attackedCountMatches[1]),
                attackedKfb: parseInt(attackedKfbMatches[1])
            };
        }
        else return null;
    },

    /**
     * 获取上一次领取争夺奖励时记录的争夺信息
     * @returns {?{lootCount: number, lootKfb: number, attackCount: number, attackKfb: number, attackedCount: number, attackedKfb: number}}
     * 上一次领取争夺奖励时记录的争夺信息
     * lootCount：争夺次数；lootKfb：争夺实际获得的KFB；attackCount：攻击次数；attackKfb：夺取KFB；attackedCount：被攻击次数；attackedKfb：被夺取KFB；
     */
    getPrevLootInfo: function () {
        var info = TmpLog.getValue(Const.prevLootInfoTmpLogName);
        if (info && $.type(info) === 'object' && $.type(info.lootCount) === 'number' && $.type(info.lootKfb) === 'number' && $.type(info.attackCount) === 'number' &&
            $.type(info.attackKfb) === 'number' && $.type(info.attackedCount) === 'number' && $.type(info.attackedKfb) === 'number') {
            return {
                lootCount: parseInt(info.lootCount),
                lootKfb: parseInt(info.lootKfb),
                attackCount: parseInt(info.attackCount),
                attackKfb: parseInt(info.attackKfb),
                attackedCount: parseInt(info.attackedCount),
                attackedKfb: parseInt(info.attackedKfb)
            };
        }
        else return null;
    }
};


/**
 * KF Online主类
 */
var KFOL = {
    // 用户ID
    uid: 0,
    // 用户名
    userName: '',
    // 是否位于首页
    isInHomePage: false,
    // 是否为移动版
    isMobile: false,
    // 当前窗口
    window: typeof unsafeWindow !== 'undefined' ? unsafeWindow : window,

    /**
     * 获取Uid和用户名
     * @returns {boolean} 是否获取成功
     */
    getUidAndUserName: function () {
        var $user = $('.topright a[href^="profile.php?action=show&uid="]').eq(0);
        if ($user.length === 0) return false;
        KFOL.userName = $user.text();
        if (!KFOL.userName) return false;
        var matches = /&uid=(\d+)/.exec($user.attr('href'));
        if (!matches) return false;
        KFOL.uid = matches[1];
        return true;
    },

    /**
     * 获取用户的SafeID
     */
    getSafeId: function () {
        var matches = /safeid=(\w+)/i.exec($('a[href*="safeid="]').eq(0).attr('href'));
        if (!matches) return '';
        else return matches[1];
    },

    /**
     * 检查浏览器类型
     */
    checkBrowserType: function () {
        if (Config.browseType === 'auto') {
            KFOL.isMobile = /(Mobile|MIDP)/i.test(navigator.userAgent);
        }
        else {
            KFOL.isMobile = Config.browseType === 'mobile';
        }
    },

    /**
     * 添加CSS样式
     */
    appendCss: function () {
        $('head').append(
            '<style type="text/css">' +
            '.pd_mask { position: fixed; width: 100%; height: 100%; left: 0; top: 0; z-index: 1000; }' +
            '.pd_pop_box { position: {0}; width: 100%; z-index: 1001; }'.replace('{0}', KFOL.isMobile ? 'absolute' : 'fixed') +
            '.pd_pop_tips {' +
            '  border: 1px solid #6ca7c0; text-shadow: 0 0 3px rgba(0,0,0,0.1); border-radius: 3px; padding: 12px 40px; text-align: center;' +
            '  font-size: 14px; position: absolute; display: none; color: #333; background: #f8fcfe; background-repeat: no-repeat;' +
            '  background-image: -webkit-linear-gradient(#F9FCFE, #F6FBFE 25%, #EFF7FC);' +
            '  background-image: -moz-linear-gradient(top, #F9FCFE, #F6FBFE 25%, #EFF7FC);' +
            '  background-image: -o-linear-gradient(#F9FCFE, #F6FBFE 25%, #EFF7FC);' +
            '  background-image: -ms-linear-gradient(#F9FCFE, #F6FBFE 25%, #EFF7FC);' +
            '  background-image: linear-gradient(#F9FCFE, #F6FBFE 25%, #EFF7FC);' +
            '}' +
            '.pd_pop_tips strong { margin-right: 5px; }' +
            '.pd_pop_tips i { font-style: normal; padding-left: 10px; }' +
            '.pd_pop_tips em, .pd_stat em, .pd_pop_tips ins, .pd_stat ins { font-weight: 700; font-style: normal; color:#FF6600; padding: 0 3px; }' +
            '.pd_pop_tips ins, .pd_stat ins { text-decoration: none; color: #339933; }' +
            '.pd_pop_tips a { font-weight: bold; margin-left: 15px; }' +
            '.pd_stat i { font-style: normal; margin-right: 3px; }' +
            '.pd_stat .pd_notice { margin-left: 5px; }' +
            '.pd_stat_extra em, .pd_stat_extra ins { padding: 0 2px; cursor: help; }' +
            '.pd_highlight { color: #FF0000 !important; }' +
            '.pd_notice, .pd_pop_tips .pd_notice { font-style: italic; color: #666; }' +
            '.pd_input, .pd_cfg_main input, .pd_cfg_main select { vertical-align: middle; height: inherit; margin-right: 0; line-height: 22px; font-size: 12px; }' +
            '.pd_input[type="text"], .pd_cfg_main input[type="text"] { height: 18px; line-height: 18px; }' +
            '.pd_input:focus, .pd_cfg_main input[type="text"]:focus, .pd_cfg_main textarea:focus, .pd_textarea:focus { border-color: #7EB4EA; }' +
            '.pd_textarea, .pd_cfg_main textarea { border: 1px solid #CCC; font-size: 12px; }' +
            '.readlou .pd_goto_link { color: #000; }' +
            '.readlou .pd_goto_link:hover { color: #51D; }' +
            '.pd_fast_goto_floor, .pd_multi_quote_chk { margin-right: 2px; }' +
            '.pages .pd_fast_goto_page { margin-left: 8px; }' +
            '.pd_fast_goto_floor span:hover, .pd_fast_goto_page span:hover { color: #51D; cursor: pointer; text-decoration: underline; }' +
            '.pd_item_btns { text-align: right; margin-top: 5px;  }' +
            '.pd_item_btns button, .pd_item_btns input { margin-left: 3px; margin-bottom: 2px; vertical-align: middle; }' +
            '.pd_result { border: 1px solid #99F; padding: 5px; margin-top: 10px; line-height: 2em; }' +
            '.pd_result_sep { border-bottom: 1px solid #999; margin: 7px 0; }' +
            '.pd_result_sep_inner { border-bottom: 1px dashed #999; margin: 5px 0; }' +
            '.pd_thread_page { margin-left: 5px; }' +
            '.pd_thread_page a { color: #444; padding: 0 3px; }' +
            '.pd_thread_page a:hover { color: #51D; }' +
            '.pd_card_chk { position: absolute; bottom: -8px; left: 1px; }' +
            '.pd_disabled_link { color: #999 !important; text-decoration: none !important; cursor: default; }' +
            '.b_tit4 .pd_thread_goto, .b_tit4_1 .pd_thread_goto { position: absolute; top: 0; right: 0; padding: 0 15px; }' +
            '.b_tit4 .pd_thread_goto:hover, .b_tit4_1 .pd_thread_goto:hover { padding-left: 15px; }' +
            '.pd_custom_tips { cursor: help; }' +
            '.pd_user_memo { font-size: 12px; color: #999; line-height: 14px; }' +
            '.pd_user_memo_tips { font-size: 12px; color: #FFF; margin-left: 3px; cursor: help; }' +
            '.pd_user_memo_tips:hover { color: #DDD; }' +
            '.pd_sm_color_select > td { position: relative; cursor: pointer; }' +
            '.pd_sm_color_select > td > input { position: absolute; top: 18px; left: 10px; }' +
            '.pd_used_item_info { color: #666; float: right; cursor: help; margin-right: 5px; }' +
            '.pd_panel { position: absolute; overflow-y: auto; background-color: #FFF; border: 1px solid #9191FF; opacity: 0.9; }' +
            '#pd_smile_panel img { margin: 3px; cursor: pointer; }' +
            '.pd_verify_tips { cursor: help; color: #999; }' +
            '.pd_verify_tips_ok { color: #99CC66; }' +
            '.pd_verify_tips_conditional { color: #FF9900; }' +
            '.pd_verify_tips_unable { color: #FF0033; }' +
            '.pd_verify_tips_details { cursor: pointer; }' +
            '#pd_monster_loot_info_panel em { font-style: normal; cursor: help; }' +
            '#pd_attack_log_content {' +
            '  width: 850px; min-height: 160px; max-height: 500px; margin: 5px 0; padding: 5px; border: 1px solid #9191FF; overflow: auto;' +
            '  line-height: 1.6em; background-color: #FFF;' +
            '}' +
            '.pd_my_items > tbody > tr > td > a + a { margin-left: 15px; }' +
            '.pd_usable_num { color: #669933; }' +
            '.pd_used_num { color: #FF0033; }' +
            '.pd_title_tips {' +
            '  position: absolute; max-width: 470px; font-size: 12px; line-height: 1.5em;' +
            '  padding: 2px 5px; background-color: #FCFCFC; border: 1px solid #767676; z-index: 9999;' +
            '}' +
            '.pd_search_type {' +
            '  float: left; height: 26px; line-height: 26px; width: 65px; text-align: center; border: 1px solid #CCC; border-left: none; cursor: pointer;' +
            '}' +
            '.pd_search_type i { font-style: normal; margin-left: 5px; font-family: "Microsoft YaHei"; }' +
            '.pd_search_type_list {' +
            '  position: absolute; width: 63px; background-color: #FCFCFC; border: 1px solid #CCC; border-top: none; line-height: 26px; text-indent: 13px; cursor: pointer;' +
            '}' +
            '.pd_search_type_list li:hover { color: #FFF; background-color: #87C3CF; }' +
            '.editor-button .pd_editor_btn { background: none; text-indent: 0; line-height: 18px; cursor: default; }' +
            '.readtext img[onclick] { max-width: 550px; }' +

            /* 设置对话框 */
            '.pd_cfg_box {' +
            '  position: {0}; border: 1px solid #9191FF; display: none; z-index: 1002;'.replace('{0}', KFOL.isMobile ? 'absolute' : 'fixed') +
            '  -webkit-box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.5); -moz-box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.5);' +
            '  -o-box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.5); box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.5);' +
            '}' +
            '.pd_cfg_box h1 {text-align: center; font-size: 14px; background-color: #9191FF; color: #FFF; line-height: 2em; margin: 0; padding-left: 20px; }' +
            '.pd_cfg_box h1 span { float: right; cursor: pointer; padding: 0 10px; }' +
            '#pd_custom_sm_color { width: 360px; }' +
            '.pd_cfg_nav { text-align: right; margin-top: 5px; margin-bottom: -5px; }' +
            '.pd_cfg_nav a { margin-left: 10px; }' +
            '.pd_cfg_main { background-color: #FCFCFC; padding: 0 10px; font-size: 12px; line-height: 22px; min-height: 180px; overflow: auto; }' +
            '.pd_cfg_main fieldset { border: 1px solid #CCCCFF; padding: 0 6px 6px; }' +
            '.pd_cfg_main legend { font-weight: bold; }' +
            '.pd_cfg_main label input, .pd_cfg_main legend input, .pd_cfg_main label select { margin: 0 5px; }' +
            '.pd_cfg_main input[type="color"] { height: 18px; width: 30px; padding: 0; }' +
            '.pd_cfg_main button { vertical-align: middle; }' +
            '.pd_cfg_main .pd_cfg_tips { color: #51D; text-decoration: none; cursor: help; }' +
            '.pd_cfg_main .pd_cfg_tips:hover { color: #FF0000; }' +
            '#pd_config .pd_cfg_main { overflow-x: hidden; white-space: nowrap; }' +
            '.pd_cfg_panel { display: inline-block; width: 380px; vertical-align: top; }' +
            '.pd_cfg_panel + .pd_cfg_panel { margin-left: 5px; }' +
            '.pd_cfg_btns { background-color: #FCFCFC; text-align: right; padding: 5px; }' +
            '.pd_cfg_btns button { width: 80px; margin-left: 5px; }' +
            '.pd_cfg_about { float: left; line-height: 24px; margin-left: 5px; }' +
            '#pd_cfg_custom_monster_name_list td input[type="text"] { width: 140px; }' +
            '#pd_cfg_follow_user_list, #pd_cfg_block_user_list { max-height: 480px; overflow: auto; }' +
            '#pd_auto_change_sm_color_btns label { margin-right: 10px; }' +

            /* 日志对话框 */
            '#pd_log { width: 880px; }' +
            '.pd_log_nav { text-align: center; margin: -5px 0 -12px; font-size: 14px; line-height: 44px; }' +
            '.pd_log_nav a { display: inline-block; }' +
            '.pd_log_nav h2 { display: inline; font-size: 14px; margin-left: 7px; margin-right: 7px; }' +
            '#pd_log_content { height: 308px; overflow: auto; }' +
            '#pd_log_content h3 { display: inline-block; font-size: 12px; line-height: 22px; margin: 0; }' +
            '#pd_log_content h3:not(:first-child) { margin-top: 5px; }' +
            '#pd_log_content p { line-height: 22px; margin: 0; }' +
            '#pd_log .pd_stat i { display: inline-block; }' +
            '</style>'
        );

        if (Config.customCssEnabled) {
            $('head').append(
                '<style type="text/css">' + Config.customCssContent + '</style>'
            );
        }
    },

    /**
     * 显示提示消息
     * @param {(string|Object)} options 提示消息或设置对象
     * @param {string} [options.msg] 提示消息
     * @param {number} [options.duration={@link Config.defShowMsgDuration}] 提示消息持续时间（秒），-1为永久显示
     * @param {boolean} [options.clickable=true] 消息框可否手动点击消除
     * @param {boolean} [options.preventable=false] 是否阻止点击网页上的其它元素
     * @param {number} [duration] 提示消息持续时间（秒），-1为永久显示
     * @example
     * KFOL.showMsg('<strong>抽取道具或卡片</strong><i>道具<em>+1</em></i>');
     * KFOL.showMsg({msg: '<strong>抽取神秘盒子</strong><i>KFB<em>+8</em></i>', duration: 20, clickable: false});
     * @returns {jQuery} 消息框的jQuery对象
     */
    showMsg: function (options, duration) {
        var settings = {
            msg: '',
            duration: Config.defShowMsgDuration,
            clickable: true,
            preventable: false
        };
        if ($.type(options) === 'object') {
            $.extend(settings, options);
        }
        else {
            settings.msg = options;
            settings.duration = typeof duration === 'undefined' ? Config.defShowMsgDuration : duration;
        }
        if ($('.pd_pop_tips').length > 20) KFOL.removePopTips($('.pd_pop_tips'));
        var $popBox = $('.pd_pop_box');
        var isFirst = $popBox.length === 0;
        if (!isFirst && $('.pd_mask').length === 0) {
            var $lastTips = $('.pd_pop_tips:last');
            if ($lastTips.length > 0) {
                var top = $lastTips.offset().top;
                var winScrollTop = $(window).scrollTop();
                if (top < winScrollTop || top >= winScrollTop + $(window).height() - $lastTips.outerHeight() - 10) {
                    $popBox.remove();
                    isFirst = true;
                }
            }
        }
        if (settings.preventable && $('.pd_mask').length === 0) {
            $('<div class="pd_mask"></div>').appendTo('body');
        }
        if (isFirst) {
            $popBox = $('<div class="pd_pop_box"></div>').appendTo('body');
        }
        var $popTips = $('<div class="pd_pop_tips">' + settings.msg + '</div>').appendTo($popBox);
        $popTips.on('click', 'a.pd_stop_action', function (e) {
            e.preventDefault();
            $(this).text('正在停止...').closest('.pd_pop_tips').data('stop', true);
        });
        if (settings.clickable) {
            $popTips.css('cursor', 'pointer').click(function () {
                $(this).stop(true, true).fadeOut('slow', function () {
                    KFOL.removePopTips($(this));
                });
            }).find('a').click(function (e) {
                e.stopPropagation();
            });
        }
        var windowWidth = $(window).width(), windowHeight = $(window).height();
        var popTipsWidth = $popTips.outerWidth(), popTipsHeight = $popTips.outerHeight();
        if (KFOL.isMobile && windowHeight > 1000) windowHeight /= 2;
        var scrollTop = $(window).scrollTop();
        if (scrollTop < windowHeight / 2) scrollTop = 0;
        var left = windowWidth / 2 + (KFOL.isMobile ? $(window).scrollLeft() / 3 : 0) - popTipsWidth / 2;
        if (left + popTipsWidth > windowWidth) left = windowWidth - popTipsWidth - 20;
        if (isFirst) {
            $popBox.css('top', windowHeight / 2 + (KFOL.isMobile ? scrollTop : 0) - popTipsHeight / 2);
        }
        else {
            $popBox.stop(false, true).animate({'top': '-=' + popTipsHeight / 1.75});
        }
        var $prev = $popTips.prev('.pd_pop_tips');
        $popTips.css('top', $prev.length > 0 ? parseInt($prev.css('top')) + $prev.outerHeight() + 5 : 0)
            .css('left', left)
            .fadeIn('slow');
        if (settings.duration !== -1) {
            $popTips.delay(settings.duration * 1000).fadeOut('slow', function () {
                KFOL.removePopTips($(this));
            });
        }
        return $popTips;
    },

    /**
     * 显示等待消息
     * @param {string} msg 等待消息
     * @param {boolean} [preventable=false] 是否阻止点击网页上的其它元素
     * @returns {jQuery} 消息框的jQuery对象
     */
    showWaitMsg: function (msg, preventable) {
        return KFOL.showMsg({msg: msg, duration: -1, clickable: false, preventable: preventable === true});
    },

    /**
     * 移除指定的提示消息框
     * @param {jQuery} $popTips 指定的消息框节点
     */
    removePopTips: function ($popTips) {
        var $parent = $popTips.parent();
        $popTips.remove();
        if ($('.pd_pop_tips').length === 0) {
            $parent.remove();
            $('.pd_mask').remove();
        }
        else if ($('#pd_remaining_num').length === 0) {
            $('.pd_mask').remove();
        }
    },

    /**
     * 在操作进行时阻止关闭页面
     */
    preventCloseWindowWhenActioning: function () {
        if (window.addEventListener) {
            window.addEventListener("beforeunload", function (e) {
                if ($('.pd_mask').length > 0) {
                    var msg = '操作正在进行中，确定要关闭页面吗？';
                    e.returnValue = msg;
                    return msg;
                }
            });
        }
    },

    /**
     * 输出经过格式化后的控制台消息
     * @param {string} msgType 消息类别
     * @param {string} html 回应的HTML源码
     */
    showFormatLog: function (msgType, html) {
        var msg = '【{0}】回应：'.replace('{0}', msgType);
        var matches = /<span style=".+?">(.+?)<\/span><br \/><a href="(.+?)">/i.exec(html);
        if (matches) {
            msg += '{0}；跳转地址：{1}{2}'
                .replace('{0}', matches[1])
                .replace('{1}', Tools.getHostNameUrl())
                .replace('{2}', matches[2]);
        }
        else {
            msg += '未能获得预期的回应';
            //msg += '\n' + html;
        }
        console.log(msg);
    },

    /**
     * KFB捐款
     * @param {boolean} [isAutoSaveCurrentDeposit=false] 是否在捐款完毕之后自动活期存款
     */
    donation: function (isAutoSaveCurrentDeposit) {
        var now = new Date();
        var date = Tools.getDateByTime(Config.donationAfterTime);
        if (now < date) {
            if (isAutoSaveCurrentDeposit) KFOL.autoSaveCurrentDeposit();
            return;
        }
        Func.run('KFOL.donation_before_');
        console.log('KFB捐款Start');
        var $tips = KFOL.showWaitMsg('<strong>正在进行捐款，请稍候...</strong>', true);

        /**
         * 获取捐款Cookies有效期
         * @returns {Date} Cookies有效期的Date对象
         */
        var getDonationCookieDate = function () {
            var now = new Date();
            var date = Tools.getTimezoneDateByTime('02:00:00');
            if (now > date) {
                date = Tools.getTimezoneDateByTime('00:00:00');
                date.setDate(date.getDate() + 1);
            }
            if (now > date) date.setDate(date.getDate() + 1);
            return date;
        };

        /**
         * 使用指定的KFB捐款
         * @param {number} kfb 指定的KFB
         */
        var donationSubmit = function (kfb) {
            $.post('kf_growup.php?ok=1', {kfb: kfb}, function (html) {
                Tools.setCookie(Const.donationCookieName, 1, getDonationCookieDate());
                KFOL.showFormatLog('捐款{0}KFB'.replace('{0}', kfb), html);
                KFOL.removePopTips($tips);

                var msg = '<strong>捐款<em>{0}</em>KFB</strong>'.replace('{0}', kfb);
                var matches = /捐款获得(\d+)经验值(?:.*?补偿期(?:.*?\+(\d+)KFB)?(?:.*?(\d+)成长经验)?)?/i.exec(html);
                if (!matches) {
                    if (/KFB不足。<br/i.test(html)) {
                        msg += '<i class="pd_notice">KFB不足</i><a target="_blank" href="kf_growup.php">手动捐款</a>';
                    }
                    else return;
                }
                else {
                    msg += '<i>经验值<em>+{0}</em></i>'.replace('{0}', matches[1]);
                    var gain = {'经验值': parseInt(matches[1])};
                    if (typeof matches[2] !== 'undefined' || typeof matches[3] !== 'undefined') {
                        msg += '<i style="margin-left:5px">(补偿期:</i>{0}{1}'
                            .replace('{0}', typeof matches[2] !== 'undefined' ?
                                '<i>KFB<em>+{0}</em>{1}</i>'
                                    .replace('{0}', matches[2])
                                    .replace('{1}', typeof matches[3] !== 'undefined' ? '' : ')')
                                : '')
                            .replace('{1}', typeof matches[3] !== 'undefined' ? '<i>经验值<em>+{0}</em>)</i>'.replace('{0}', matches[3]) : '');
                        if (typeof matches[2] !== 'undefined')
                            gain['KFB'] = parseInt(matches[2]);
                        if (typeof matches[3] !== 'undefined')
                            gain['经验值'] += parseInt(matches[3]);
                    }
                    Log.push('捐款', '捐款`{0}`KFB'.replace('{0}', kfb), {gain: gain, pay: {'KFB': -kfb}});
                }
                KFOL.showMsg(msg);
                if (isAutoSaveCurrentDeposit) KFOL.autoSaveCurrentDeposit();
                Func.run('KFOL.donation_after_', html);
            }, 'html');
        };

        if (/%$/.test(Config.donationKfb)) {
            $.get('profile.php?action=show&uid={0}&t={1}'.replace('{0}', KFOL.uid).replace('{1}', new Date().getTime()), function (html) {
                var matches = /论坛货币：(-?\d+)\s*KFB/i.exec(html);
                var income = 1;
                if (matches) income = parseInt(matches[1]);
                else console.log('当前持有KFB获取失败');
                var donationKfb = parseInt(Config.donationKfb);
                donationKfb = Math.floor(income * donationKfb / 100);
                donationKfb = donationKfb > 0 ? donationKfb : 1;
                donationKfb = donationKfb <= Const.maxDonationKfb ? donationKfb : Const.maxDonationKfb;
                donationSubmit(donationKfb);
            }, 'html');
        }
        else {
            $.get('kf_growup.php?t=' + new Date().getTime(), function (html) {
                if (/>今天已经捐款</.test(html)) {
                    KFOL.removePopTips($tips);
                    Tools.setCookie(Const.donationCookieName, 1, getDonationCookieDate());
                }
                else {
                    donationSubmit(parseInt(Config.donationKfb));
                }
            }, 'html');
        }
    },

    /**
     * 获取下次抽取神秘盒子的时间对象
     * @returns {{type: number, time: number}} 下次抽取神秘盒子的时间对象，type：时间类型（0：获取失败；1：估计时间；2：精确时间）；time：下次领取时间
     */
    getNextDrawSmboxTime: function () {
        var log = Tools.getCookie(Const.drawSmboxCookieName);
        if (log) {
            log = log.split('|');
            if (log.length === 2) {
                var type = parseInt(log[0]);
                var time = parseInt(log[1]);
                if (!isNaN(type) && !isNaN(time) && type > 0 && time > 0) {
                    return {type: parseInt(type), time: parseInt(time)};
                }
            }
        }
        return {type: 0, time: 0};
    },

    /**
     * 抽取神秘盒子
     */
    drawSmbox: function () {
        Func.run('KFOL.drawSmbox_before_');
        console.log('抽取神秘盒子Start');
        $.get('kf_smbox.php?t=' + new Date().getTime(), function (html) {
            if (KFOL.getNextDrawSmboxTime().type) return;
            if (!/kf_smbox\.php\?box=\d+&safeid=\w+/i.test(html)) {
                KFOL.showFormatLog('抽取神秘盒子', html);
                return;
            }
            var smboxNumber = 0;
            var url = '';
            for (var i in Config.favorSmboxNumbers) {
                var regex = new RegExp('kf_smbox\\.php\\?box=' + Config.favorSmboxNumbers[i] + '&safeid=\\w+', 'i');
                var favorMatches = regex.exec(html);
                if (favorMatches) {
                    smboxNumber = Config.favorSmboxNumbers[i];
                    url = favorMatches[0];
                    break;
                }
            }
            if (!url) {
                var matches = html.match(/kf_smbox\.php\?box=\d+&safeid=\w+/gi);
                if (!matches) return;
                url = matches[Math.floor(Math.random() * matches.length)];
                var numberMatches = /box=(\d+)/i.exec(url);
                smboxNumber = numberMatches ? numberMatches[1] : 0;
            }
            $.get(url + '&t=' + new Date().getTime(), function (html) {
                var nextTime = Tools.getDate('+' + Const.defDrawSmboxInterval + 'm');
                Tools.setCookie(Const.drawSmboxCookieName, '2|' + nextTime.getTime(), nextTime);
                KFOL.showFormatLog('抽取神秘盒子', html);
                var kfbRegex = /获得了(\d+)KFB的奖励.*?(\(\d+\|\d+\))/i;
                var smRegex = /获得本轮的头奖/i;
                var msg = '<strong>抽取神秘盒子[<em>No.{0}</em>]</strong>'.replace('{0}', smboxNumber);
                var gain = {};
                var action = '抽取神秘盒子[`No.{0}`]'.replace('{0}', smboxNumber);
                if (kfbRegex.test(html)) {
                    var matches = kfbRegex.exec(html);
                    msg += '<i>KFB<em>+{0}</em></i><i class="pd_notice">{1}</i>'
                        .replace('{0}', matches[1])
                        .replace('{1}', matches[2]);
                    gain['KFB'] = parseInt(matches[1]);
                    action += ' ' + matches[2];
                }
                else if (smRegex.test(html)) {
                    msg += '<i class="pd_highlight" style="font-weight:bold">KFB<em>+{0}</em></i><a target="_blank" href="kf_smbox.php">查看头奖</a>'
                        .replace('{0}', Const.smboxFirstPrizeBonus);
                    gain['KFB'] = Const.smboxFirstPrizeBonus;
                }
                else {
                    nextTime = Tools.getDate('+1h');
                    Tools.setCookie(Const.drawSmboxCookieName, '1|' + nextTime.getTime(), nextTime);
                    return;
                }
                Log.push('抽取神秘盒子', action, {gain: gain});
                KFOL.showMsg(msg);
                if (KFOL.isInHomePage) {
                    $('a[href="kf_smbox.php"].indbox5').removeClass('indbox5').addClass('indbox6');
                }
                Func.run('KFOL.drawSmbox_after_', html);
            }, 'html');
        }, 'html');
    },

    /**
     * 添加神秘盒子链接点击事件
     */
    addSmboxLinkClickEvent: function () {
        $('.box1').on('click', 'a[href^="kf_smbox.php?box="]', function () {
            if (KFOL.getNextDrawSmboxTime().type) return;
            var nextTime = Tools.getDate('+' + Const.defDrawSmboxInterval + 'm').getTime() + 10 * 1000;
            Tools.setCookie(Const.drawSmboxCookieName, '2|' + nextTime, new Date(nextTime));
        });
    },

    /**
     * 获取倒计时的最小时间间隔（秒）
     * @returns {number} 倒计时的最小时间间隔（秒）
     */
    getMinRefreshInterval: function () {
        var donationInterval = -1;
        if (Config.autoDonationEnabled) {
            var donationTime = Tools.getDateByTime(Config.donationAfterTime);
            var now = new Date();
            if (!Tools.getCookie(Const.donationCookieName) && now <= donationTime) {
                donationInterval = Math.floor((donationTime - now) / 1000);
            }
            else {
                donationTime.setDate(donationTime.getDate() + 1);
                donationInterval = Math.floor((donationTime - now) / 1000);
            }
        }

        var getLootAwardInterval = -1, autoAttackInterval = -1, attackCheckInterval = -1;
        if (Config.autoLootEnabled) {
            var lootTimeLog = Loot.getNextLootAwardTime();
            if (lootTimeLog.type > 0) {
                getLootAwardInterval = Math.floor((lootTimeLog.time - new Date().getTime()) / 1000);
                if (getLootAwardInterval < 0) getLootAwardInterval = 0;
            }
            else getLootAwardInterval = 0;
            if (Config.noAutoLootWhen.length > 0) {
                var next = Tools.getDate('+' + getLootAwardInterval + 's');
                var now = new Date();
                for (var i in Config.noAutoLootWhen) {
                    var whenArr = Config.noAutoLootWhen[i].split('-');
                    if (whenArr.length !== 2) continue;
                    var start = Tools.getDateByTime(whenArr[0]);
                    var end = Tools.getDateByTime(whenArr[1]);
                    if (end < start) {
                        if (now > end) end.setDate(end.getDate() + 1);
                        else start.setDate(start.getDate() - 1);
                    }
                    if (next >= start && next <= end) {
                        getLootAwardInterval = Math.floor((end - now) / 1000);
                        break;
                    }
                }
            }
            if (Config.autoAttackEnabled && Config.attackAfterTime > 0 && !$.isEmptyObject(Config.batchAttackList)
                && Tools.getCookie(Const.autoAttackReadyCookieName) && !Tools.getCookie(Const.autoAttackingCookieName)) {
                if (lootTimeLog.type > 0) {
                    var attackAfterTime = Config.attackAfterTime;
                    if (lootTimeLog.type === 1) {
                        var diff = attackAfterTime - Const.minAttackAfterTime - 30;
                        if (diff < 0) diff = 0;
                        else if (diff > 30) diff = 30;
                        attackAfterTime -= diff;
                    }
                    autoAttackInterval = Math.floor((lootTimeLog.time - attackAfterTime * 60 * 1000 - new Date().getTime()) / 1000);
                    if (autoAttackInterval < 0) autoAttackInterval = 0;
                }
                else autoAttackInterval = 0;
                if (Config.attemptAttackEnabled && autoAttackInterval > 0) {
                    var time = parseInt(Tools.getCookie(Const.checkLifeCookieName));
                    var now = new Date();
                    if (!isNaN(time) && time > 0 && time >= now.getTime()) {
                        attackCheckInterval = Math.floor((time - now.getTime()) / 1000);
                    }
                    else attackCheckInterval = 0;
                }
            }
            if (Config.autoAttackEnabled && autoAttackInterval === -1 && Tools.getCookie(Const.autoAttackingCookieName))
                autoAttackInterval = Const.checkAutoAttackingInterval * 60 + 1;
        }

        var drawSmboxInterval = -1;
        if (Config.autoDrawSmbox2Enabled) {
            var smboxTimeLog = KFOL.getNextDrawSmboxTime();
            if (smboxTimeLog.type > 0) {
                drawSmboxInterval = Math.floor((smboxTimeLog.time - new Date().getTime()) / 1000);
                if (drawSmboxInterval < 0) drawSmboxInterval = 0;
            }
            else drawSmboxInterval = 0;
        }

        var autoChangeSMColorInterval = -1;
        if (Config.autoChangeSMColorEnabled) {
            var nextTime = parseInt(Tools.getCookie(Const.autoChangeSMColorCookieName));
            if (!isNaN(nextTime) && nextTime > 0) {
                autoChangeSMColorInterval = Math.floor((nextTime - new Date().getTime()) / 1000);
                if (autoChangeSMColorInterval < 0) autoChangeSMColorInterval = 0;
                if (!Config.changeAllAvailableSMColorEnabled && Config.customAutoChangeSMColorList.length <= 1)
                    autoChangeSMColorInterval = -1;
            }
            else autoChangeSMColorInterval = 0;
        }

        var minArr = [donationInterval, getLootAwardInterval, autoAttackInterval, attackCheckInterval, drawSmboxInterval, autoChangeSMColorInterval];
        minArr.sort(function (a, b) {
            return a > b;
        });
        var min = -1;
        for (var i in minArr) {
            if (minArr[i] > -1) {
                min = minArr[i];
                break;
            }
        }
        if (min <= -1) return -1;
        else return min > 0 ? min + 1 : 0;
    },

    /**
     * 启动定时模式
     */
    startAutoRefreshMode: function () {
        var interval = KFOL.getMinRefreshInterval();
        if (interval === -1) return;
        var oriTitle = document.title;
        var titleItvFunc = null;
        var prevInterval = -1, errorNum = 0;
        /**
         * 获取经过格式化的倒计时标题
         * @param {number} type 倒计时显示类型，1：[小时:][分钟:]秒钟；2：[小时:]分钟
         * @param {number} interval 倒计时
         * @returns {string} 经过格式化的倒计时标题
         */
        var getFormatIntervalTitle = function (type, interval) {
            var textInterval = '';
            var diff = Tools.getTimeDiffInfo(Tools.getDate('+' + interval + 's').getTime());
            textInterval = diff.hours > 0 ? diff.hours + '时' : '';
            if (type === 1)
                textInterval += (diff.minutes > 0 ? diff.minutes + '分' : '') + diff.seconds + '秒';
            else
                textInterval += diff.minutes + '分';
            return textInterval;
        };
        /**
         * 显示定时模式标题提示
         * @param {number} interval 倒计时的时间间隔（秒）
         * @param {boolean} [isShowTitle=false] 是否立即显示标题
         */
        var showRefreshModeTips = function (interval, isShowTitle) {
            if (titleItvFunc) window.clearInterval(titleItvFunc);
            var showInterval = interval;
            console.log('【定时模式】倒计时：' + getFormatIntervalTitle(1, showInterval));
            if (Config.showRefreshModeTipsType.toLowerCase() !== 'never') {
                var showIntervalTitle = function () {
                    document.title = '{0} (定时: {1})'
                        .replace('{0}', oriTitle)
                        .replace('{1}', getFormatIntervalTitle(interval < 60 ? 1 : 2, showInterval));
                    showInterval = interval < 60 ? showInterval - 1 : showInterval - 60;
                };
                if (isShowTitle || Config.showRefreshModeTipsType.toLowerCase() === 'always' || interval < 60)
                    showIntervalTitle();
                else showInterval = interval < 60 ? showInterval - 1 : showInterval - 60;
                titleItvFunc = window.setInterval(showIntervalTitle, Const.showRefreshModeTipsInterval * 60 * 1000);
            }
        };
        var handleError = function () {
            var interval = 0, errorText = '';
            $.ajax({
                type: 'GET',
                url: 'index.php?t=' + new Date().getTime(),
                success: function (html) {
                    if (!/"kf_fw_ig_index.php"/i.test(html)) {
                        interval = 10;
                        errorText = '论坛维护或其它未知情况';
                    }
                },
                error: function () {
                    interval = Const.errorRefreshInterval;
                    errorText = '连接超时';
                },
                complete: function () {
                    if (interval > 0) {
                        console.log('定时操作失败（原因：{0}），将在{1}分钟后重试...'.replace('{0}', errorText).replace('{1}', interval));
                        KFOL.removePopTips($('.pd_refresh_notice').parent());
                        KFOL.showMsg('<strong class="pd_refresh_notice">定时操作失败（原因：{0}），将在<em>{1}</em>分钟后重试...</strong>'
                            .replace('{0}', errorText)
                            .replace('{1}', interval)
                            , -1);
                        window.setTimeout(handleError, interval * 60 * 1000);
                        showRefreshModeTips(interval * 60, true);
                    }
                    else {
                        if (errorNum > 6) {
                            errorNum = 0;
                            interval = 15;
                            window.setTimeout(checkRefreshInterval, interval * 60 * 1000);
                            showRefreshModeTips(interval * 60, true);
                        }
                        else {
                            errorNum++;
                            checkRefreshInterval();
                        }
                    }
                },
                dataType: 'html'
            });
        };
        var checkRefreshInterval = function () {
            KFOL.removePopTips($('.pd_refresh_notice').parent());
            var isGetLootAwardStarted = false;
            var autoDonationAvailable = Config.autoDonationEnabled && !Tools.getCookie(Const.donationCookieName);
            if (Config.autoLootEnabled && !Loot.getNextLootAwardTime().type) {
                isGetLootAwardStarted = true;
                Loot.getLootAward(autoDonationAvailable, Config.autoSaveCurrentDepositEnabled);
            }
            if (Config.autoDrawSmbox2Enabled && !KFOL.getNextDrawSmboxTime().type) {
                KFOL.drawSmbox();
            }
            if (autoDonationAvailable && !isGetLootAwardStarted) {
                KFOL.donation();
            }
            if (Config.autoLootEnabled && Config.autoAttackEnabled && Tools.getCookie(Const.autoAttackReadyCookieName)
                && !Tools.getCookie(Const.autoAttackingCookieName)) {
                Loot.checkAutoAttack();
            }
            if (Config.autoChangeSMColorEnabled && !Tools.getCookie(Const.autoChangeSMColorCookieName)) KFOL.changeSMColor();

            var interval = KFOL.getMinRefreshInterval();
            if (interval > 0) errorNum = 0;
            if (interval === 0 && prevInterval === 0) {
                prevInterval = -1;
                handleError();
                return;
            }
            else prevInterval = interval;
            if (interval === -1) {
                if (titleItvFunc) window.clearInterval(titleItvFunc);
                return;
            }
            else if (interval === 0) interval = Const.actionFinishRetryInterval;
            window.setTimeout(checkRefreshInterval, interval * 1000);
            showRefreshModeTips(interval, true);
        };
        window.setTimeout(checkRefreshInterval, interval < 60 ? 60 * 1000 : interval * 1000);
        showRefreshModeTips(interval < 60 ? 60 : interval);
    },

    /**
     * 添加设置和日志对话框的链接
     */
    addConfigAndLogDialogLink: function () {
        var $login = $('a[href^="login.php?action=quit"]:eq(0)');
        $('<a href="#">助手设置</a><span style="margin:0 4px">|</span>').insertBefore($login)
            .filter('a').click(function (e) {
            e.preventDefault();
            ConfigDialog.show();
        });
        if (Config.showLogLinkInPageEnabled) {
            $('<a href="#">助手日志</a><span style="margin:0 4px">|</span>').insertBefore($login)
                .filter('a').click(function (e) {
                e.preventDefault();
                Log.show();
            });
        }
    },

    /**
     * 处理首页有人@你的消息框
     */
    handleAtTips: function () {
        var type = Config.atTipsHandleType;
        if (type === 'default') return;
        var $atTips = $('a[href^="guanjianci.php?gjc="]');
        var noHighlight = function () {
            $atTips.removeClass('indbox5').addClass('indbox6');
        };
        var hideBox = function () {
            $atTips.parent().next('div.line').addBack().remove();
        };
        var handleBox = noHighlight;
        if (type === 'hide_box_1' || type === 'hide_box_2') handleBox = hideBox;
        if (type === 'no_highlight' || type === 'no_highlight_extra' || type === 'hide_box_1' || type === 'at_change_to_cao') {
            if ($atTips.length > 0) {
                var cookieText = Tools.getCookie(Const.hideMarkReadAtTipsCookieName);
                var atTipsText = $.trim($atTips.text());
                var matches = /\d+日\d+时\d+分/.exec(atTipsText);
                if (matches) atTipsText = matches[0];
                if (cookieText && cookieText === atTipsText) {
                    handleBox();
                }
                else {
                    $atTips.click(function () {
                        var $this = $(this);
                        if ($this.data('disabled')) return;
                        var cookieText = Tools.getCookie(Const.hideMarkReadAtTipsCookieName);
                        if (!cookieText) {
                            var curDate = (new Date()).getDate();
                            Tools.setCookie(Const.prevReadAtTipsCookieName, (curDate < 10 ? '0' + curDate : curDate) + '日00时00分');
                        }
                        else if (cookieText !== atTipsText) {
                            Tools.setCookie(Const.prevReadAtTipsCookieName, cookieText);
                        }
                        Tools.setCookie(Const.hideMarkReadAtTipsCookieName,
                            atTipsText,
                            Tools.getDate('+' + Const.hideMarkReadAtTipsExpires + 'd')
                        );
                        $this.data('disabled', true);
                        handleBox();
                    });
                }
                if (type === 'at_change_to_cao') {
                    $atTips.text($atTips.text().replace('@', '艹'));
                }
            }
            else if ($atTips.length === 0 && (type === 'no_highlight_extra' || type === 'at_change_to_cao')) {
                var html = ('<div style="width:300px;"><a href="guanjianci.php?gjc={0}" target="_blank" class="indbox6">最近无人{1}你</a>' +
                '<br /><div class="line"></div><div class="c"></div></div><div class="line"></div>')
                    .replace('{0}', KFOL.userName)
                    .replace('{1}', type === 'at_change_to_cao' ? '艹' : '@');
                $('a[href="kf_givemekfb.php"][title="网站虚拟货币"]').parent().before(html);
            }
        }
        else if (type === 'hide_box_2') {
            if ($atTips.length > 0) handleBox();
        }
    },

    /**
     * 高亮at提醒页面中未读的消息
     */
    highlightUnReadAtTipsMsg: function () {
        if ($.trim($('.kf_share1:first').text()) !== '含有关键词 “{0}” 的内容'.replace('{0}', KFOL.userName)) return;
        var timeString = Tools.getCookie(Const.prevReadAtTipsCookieName);
        if (!timeString || !/^\d+日\d+时\d+分$/.test(timeString)) return;
        var prevString = '';
        $('.kf_share1:eq(1) > tbody > tr:gt(0) > td:first-child').each(function (index) {
            var $this = $(this);
            var curString = $.trim($this.text());
            if (index === 0) prevString = curString;
            if (timeString < curString && prevString >= curString) {
                $this.addClass('pd_highlight');
                prevString = curString;
            }
            else return false;
        });
        $('.kf_share1').on('click', 'td > a', function () {
            Tools.setCookie(Const.prevReadAtTipsCookieName, '', Tools.getDate('-1d'));
        });
    },

    /**
     * 为帖子里的每个楼层添加跳转链接
     */
    addFloorGotoLink: function () {
        $('.readlou > div:nth-child(2) > span').each(function () {
            var $this = $(this);
            var floorText = $this.text();
            if (!/^\d+楼$/.test(floorText)) return;
            var linkName = $this.closest('.readlou').prev().attr('name');
            if (!linkName || !/^\d+$/.test(linkName)) return;
            var url = '{0}read.php?tid={1}&spid={2}'
                .replace('{0}', Tools.getHostNameUrl())
                .replace('{1}', Tools.getUrlParam('tid'))
                .replace('{2}', linkName);
            $this.html('<a class="pd_goto_link" href="{0}">{1}</a>'.replace('{0}', url).replace('{1}', floorText));
            $this.find('a').click(function (e) {
                e.preventDefault();
                window.prompt('本楼的跳转链接（请按Ctrl+C复制）：', url);
            });
        });
    },

    /**
     * 添加快速跳转到指定楼层的输入框
     */
    addFastGotoFloorInput: function () {
        $('<form><li class="pd_fast_goto_floor">电梯直达 <input class="pd_input" style="width:30px" type="text" maxlength="8" /> ' +
            '<span>楼</span></li></form>')
            .prependTo('.readlou:eq(0) > div:first-child > ul')
            .submit(function (e) {
                e.preventDefault();
                var floor = parseInt($.trim($(this).find('input').val()));
                if (!floor || floor <= 0) return;
                location.href = '{0}read.php?tid={1}&page={2}&floor={3}'
                    .replace('{0}', Tools.getHostNameUrl)
                    .replace('{1}', Tools.getUrlParam('tid'))
                    .replace('{2}', parseInt(floor / Config.perPageFloorNum) + 1)
                    .replace('{3}', floor);
            })
            .find('span')
            .click(function () {
                $(this).closest('form').submit();
            })
            .end()
            .closest('div').next()
            .css({'max-width': '505px', 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis'});
    },

    /**
     * 将页面滚动到指定楼层
     */
    fastGotoFloor: function () {
        var floor = parseInt(Tools.getUrlParam('floor'));
        if (!floor || floor <= 0) return;
        var $floorNode = $('.readlou > div:nth-child(2) > span:contains("{0}楼")'.replace('{0}', floor));
        if ($floorNode.length === 0) return;
        var linkName = $floorNode.closest('.readlou').prev().attr('name');
        if (!linkName || !/^\d+$/.test(linkName)) return;
        location.hash = '#' + linkName;
    },

    /**
     * 高亮今日新发表帖子的发表时间
     */
    highlightNewPost: function () {
        $('.thread1 > tbody > tr > td:last-child').has('a.bl').each(function () {
            var html = $(this).html();
            if (/\|\s*\d{2}:\d{2}<br>\n.*\d{2}:\d{2}/.test(html)) {
                html = html.replace(/(\d{2}:\d{2})<br>/, '<span class="pd_highlight">$1</span><br />');
                $(this).html(html);
            }
        });
    },

    /**
     * 修改指定楼层的神秘颜色
     * @param {jQuery} $element 指定楼层的发帖者的用户名链接的jQuery对象
     * @param {string} color 神秘颜色
     */
    modifyFloorSmColor: function ($element, color) {
        if ($element.is('.readidmsbottom > a')) $element.css('color', color);
        $element.closest('.readtext').css('border-color', color)
            .prev('.readlou').css('border-color', color)
            .next().next('.readlou').css('border-color', color);
    },

    /**
     * 修改本人的神秘颜色
     */
    modifyMySmColor: function () {
        var $my = $('.readidmsbottom > a[href="profile.php?action=show&uid={0}"]'.replace('{0}', KFOL.uid));
        if ($my.length === 0) $my = $('.readidmleft > a[href="profile.php?action=show&uid={0}"]'.replace('{0}', KFOL.uid));
        if ($my.length > 0) KFOL.modifyFloorSmColor($my, Config.customMySmColor);
    },

    /**
     * 修改各等级神秘颜色
     */
    modifySmColor: function () {
        if (Config.customSmColorConfigList.length === 0) return;
        $('.readidmsbottom > a[href^="profile.php?action=show&uid="], .readidmleft > a').each(function () {
            var $this = $(this);
            var smLevel = '';
            if ($this.is('.readidmleft > a')) {
                smLevel = $this.parent().next('.readidmright').text().toUpperCase();
                if (!/(-?\d+|MAX)/i.test(smLevel)) return;
            }
            else {
                var matches = /(-?\d+|MAX)级神秘/i.exec($this.parent().contents().last().text());
                if (!matches) return;
                smLevel = matches[1].toUpperCase();
            }
            $.each(Config.customSmColorConfigList, function (index, data) {
                if (Tools.compareSmLevel(smLevel, data.min) >= 0 && Tools.compareSmLevel(smLevel, data.max) <= 0) {
                    KFOL.modifyFloorSmColor($this, data.color);
                    return false;
                }
            });
        });
    },

    /**
     * 在帖子列表页面中添加帖子页数快捷链接
     */
    addFastGotoThreadPageLink: function () {
        $('.threadtit1 > a[href^="read.php"]').each(function () {
            var $link = $(this);
            var floorNum = $link.closest('td').next().find('ul > li > a').contents().eq(0).text();
            if (!floorNum || floorNum < Config.perPageFloorNum) return;
            var url = $link.attr('href');
            var totalPageNum = Math.floor(floorNum / Config.perPageFloorNum) + 1;
            var html = '';
            for (var i = 1; i < totalPageNum; i++) {
                if (i > Config.maxFastGotoThreadPageNum) {
                    if (i + 1 <= totalPageNum) {
                        html += '..<a href="{0}&page={1}">{2}</a>'
                            .replace('{0}', url)
                            .replace('{1}', totalPageNum)
                            .replace('{2}', totalPageNum);
                    }
                    break;
                }
                html += '<a href="{0}&page={1}">{2}</a>'.replace('{0}', url).replace('{1}', i + 1).replace('{2}', i + 1);
            }
            html = '<span class="pd_thread_page">...{0}</span>'.replace('{0}', html);
            $link.after(html).parent().css('white-space', 'normal');
        });
    },

    /**
     * 调整帖子内容宽度，使其保持一致
     */
    adjustThreadContentWidth: function () {
        $('head').append(
            '<style type="text/css">' +
            '.readtext > table > tbody > tr > td { padding-left: 192px; }' +
            '.readidms, .readidm { margin-left: -192px !important; }' +
            '</style>'
        );
    },

    /**
     * 调整帖子内容字体大小
     */
    adjustThreadContentFontSize: function () {
        if (Config.threadContentFontSize > 0 && Config.threadContentFontSize !== 12) {
            $('head').append(
                '<style type="text/css">' +
                '.readtext td { font-size: {0}px; line-height: 1.6em; }'.replace('{0}', Config.threadContentFontSize) +
                '.readtext td > div, .readtext td > .read_fds { font-size: 12px; }' +
                '</style>'
            );
        }
    },

    /**
     * 添加复制购买人名单的链接
     */
    addCopyBuyersListLink: function () {
        $('<a style="margin:0 2px 0 5px" href="#">复制名单</a>').insertAfter('.readtext select[name="buyers"]').click(function (e) {
            e.preventDefault();
            var buyerList = [];
            $(this).prev('select').children('option').each(function (index) {
                var name = $(this).text();
                if (index === 0 || name === '-----------') return;
                buyerList.push(name);
            });
            if (buyerList.length === 0) {
                alert('暂时无人购买');
                return;
            }
            if ($('#pd_copy_buyer_list').length > 0) return;
            var html =
                '<div class="pd_cfg_main">' +
                '  <textarea style="width:200px;height:300px;margin:5px 0" readonly="readonly"></textarea>' +
                '</div>';
            var $dialog = Dialog.create('pd_copy_buyer_list', '购买人名单', html);
            Dialog.show('pd_copy_buyer_list');
            $dialog.find('textarea').val(buyerList.join('\n')).select().focus();
        });
    },

    /**
     * 显示统计回帖者名单对话框
     * @param {string[]} replyerList 回帖者名单列表
     */
    showStatReplyersDialog: function (replyerList) {
        var html =
            '<div class="pd_cfg_main">' +
            '  <div id="pd_replyer_list_filter" style="margin-top:5px">' +
            '    <label><input type="checkbox" checked="checked" />显示楼层号</label>' +
            '    <label><input type="checkbox" />去除重复</label>' +
            '    <label><input type="checkbox" />去除楼主</label>' +
            '  </div>' +
            '  <div style="color:#FF0000" id="pd_replyer_list_stat"></div>' +
            '  <textarea style="width:250px;height:300px;margin:5px 0" readonly="readonly"></textarea>' +
            '</div>';
        var $dialog = Dialog.create('pd_replyer_list', '回帖者名单', html);

        var $filterNodes = $dialog.find('#pd_replyer_list_filter input');
        $filterNodes.click(function () {
            var list = replyerList.concat();
            var isShowFloor = $filterNodes.eq(0).prop('checked'),
                isDeduplication = $filterNodes.eq(1).prop('checked'),
                isRemoveTopFloor = $filterNodes.eq(2).prop('checked');
            if (isDeduplication) {
                for (var i in list) {
                    if ($.inArray(list[i], list) !== parseInt(i))
                        list[i] = null;
                }
            }
            if (isRemoveTopFloor) {
                var topFloor = $('.readtext:eq(0)').find('.readidmsbottom, .readidmleft').find('a').text();
                for (var i in list) {
                    if (list[i] === topFloor)
                        list[i] = null;
                }
            }
            var content = '';
            var num = 0;
            for (var i in list) {
                if (!list[i]) continue;
                content += (isShowFloor ? i + 'L：' : '') + list[i] + '\n';
                num++;
            }
            $dialog.find('textarea').val(content);
            $('#pd_replyer_list_stat').html('共有<b>{0}</b>条项目'.replace('{0}', num));
        });
        $dialog.find('#pd_replyer_list_filter input:first').triggerHandler('click');

        Dialog.show('pd_replyer_list');
        $dialog.find('input:first').focus();
    },

    /**
     * 添加统计回帖者名单的链接
     */
    addStatReplyersLink: function () {
        if (Tools.getCurrentThreadPage() !== 1) return;
        $('<li><a href="#" title="统计回帖者名单">[统计回帖]</a></li>').prependTo('.readlou:eq(1) > div > .pages')
            .find('a').click(function (e) {
            e.preventDefault();
            if ($('#pd_replyer_list').length > 0) return;
            var value = $.trim(window.prompt('统计到第几楼？（0表示统计所有楼层，可用m-n的方式来设定统计楼层的区间范围）', 0));
            if (value === '') return;
            if (!/^\d+(-\d+)?$/.test(value)) {
                alert('统计楼层格式不正确');
                return;
            }
            var startFloor = 0, endFloor = 0;
            var valueArr = value.split('-');
            if (valueArr.length === 2) {
                startFloor = parseInt(valueArr[0]);
                endFloor = parseInt(valueArr[1]);
            }
            else endFloor = parseInt(valueArr[0]);
            if (endFloor < startFloor) {
                alert('统计楼层格式不正确');
                return;
            }
            var matches = /(\d+)页/.exec($('.pages:eq(0) > li:last-child > a').text());
            var maxPage = matches ? parseInt(matches[1]) : 1;
            if (startFloor === 0) startFloor = 1;
            if (endFloor === 0) endFloor = maxPage * Config.perPageFloorNum - 1;
            var startPage = Math.floor(startFloor / Config.perPageFloorNum) + 1;
            var endPage = Math.floor(endFloor / Config.perPageFloorNum) + 1;
            if (endPage > maxPage) endPage = maxPage;
            if (endPage - startPage > Const.statReplyersMaxPage) {
                alert('需访问的总页数不可超过' + Const.statReplyersMaxPage);
                return;
            }
            var tid = Tools.getUrlParam('tid');
            if (!tid) return;
            KFOL.showWaitMsg('<strong>正在统计回帖名单中...</strong><i>剩余页数：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                .replace('{0}', endPage - startPage + 1)
                , true);
            $(document).clearQueue('StatReplyers');
            var replyerList = [];
            $.each(new Array(endPage), function (index) {
                if (index + 1 < startPage) return;
                $(document).queue('StatReplyers', function () {
                    var url = 'read.php?tid={0}&page={1}&t={2}'.replace('{0}', tid).replace('{1}', index + 1).replace('{2}', new Date().getTime());
                    $.get(url, function (html) {
                        var matches = html.match(/<span style=".+?">\d+楼<\/span> <span style=".+?">(.|\n|\r\n)+?<a href="profile\.php\?action=show&uid=\d+" target="_blank" style=".+?">.+?<\/a>/gi);
                        var isStop = false;
                        for (var i in matches) {
                            var floorMatches = /<span style=".+?">(\d+)楼<\/span>(?:.|\n|\r\n)+?<a href="profile\.php\?action=show&uid=\d+".+?>(.+?)<\/a>/i.exec(matches[i]);
                            if (!floorMatches) continue;
                            var floor = parseInt(floorMatches[1]);
                            if (floor < startFloor) continue;
                            if (floor > endFloor) {
                                isStop = true;
                                break;
                            }
                            replyerList[floor] = floorMatches[2];
                        }

                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        isStop = isStop || $remainingNum.closest('.pd_pop_tips').data('stop');
                        if (isStop) $(document).clearQueue('StatReplyers');

                        if (isStop || index === endPage - 1) {
                            KFOL.removePopTips($('.pd_pop_tips'));
                            KFOL.showStatReplyersDialog(replyerList);
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('StatReplyers');
                            }, Const.defAjaxInterval);
                        }
                    }, 'html');
                });
            });
            $(document).dequeue('StatReplyers');
        });
    },

    /**
     * 获取多重引用数据
     * @returns {Object[]} 多重引用数据列表
     */
    getMultiQuoteData: function () {
        var quoteList = [];
        $('.pd_multi_quote_chk input:checked').each(function () {
            var $readLou = $(this).closest('.readlou');
            var matches = /(\d+)楼/.exec($readLou.find('.pd_goto_link').text());
            var floor = matches ? parseInt(matches[1]) : 0;
            var spid = $readLou.prev('a').attr('name');
            var userName = $readLou.next('.readtext').find('.readidmsbottom > a, .readidmleft > a').text();
            if (!userName) return;
            quoteList.push({floor: floor, spid: spid, userName: userName});
        });
        return quoteList;
    },

    /**
     * 添加多重回复和多重引用的按钮
     */
    addMultiQuoteButton: function () {
        var replyUrl = $('a[href^="post.php?action=reply"].b_tit2').attr('href');
        if (!replyUrl) return;
        $('<li class="pd_multi_quote_chk"><label title="多重引用"><input type="checkbox" /> 引</label></li>')
            .prependTo($('.readlou > div:first-child > ul').has('a[title="引用回复这个帖子"]'))
            .find('input').click(function () {
            var tid = parseInt(Tools.getUrlParam('tid'));
            var data = localStorage[Const.multiQuoteStorageName];
            if (data) {
                try {
                    data = JSON.parse(data);
                    if (!data || $.type(data) !== 'object' || $.isEmptyObject(data)) data = null;
                    else if (typeof data.tid === 'undefined' || data.tid !== tid || $.type(data.quoteList) !== 'array')
                        data = null;
                }
                catch (ex) {
                    data = null;
                }
            }
            else {
                data = null;
            }
            var quoteList = KFOL.getMultiQuoteData();
            if (!data) {
                localStorage.removeItem(Const.multiQuoteStorageName);
                data = {tid: tid, quoteList: []};
            }
            var page = Tools.getCurrentThreadPage();
            if (quoteList.length > 0) data.quoteList[page] = quoteList;
            else delete data.quoteList[page];
            localStorage[Const.multiQuoteStorageName] = JSON.stringify(data);
        });
        $('.readlou:last').next('div').find('table > tbody > tr > td:last-child')
            .css({'text-align': 'right', 'width': '320px'})
            .append(('<span class="b_tit2" style="margin-left:5px"><a style="display:inline-block" href="#" title="多重回复">回复</a> ' +
            '<a style="display:inline-block" href="{0}" title="多重引用">引用</a></span>')
                .replace('{0}', replyUrl + '&multiquote=true'))
            .find('.b_tit2 > a:eq(0)').click(function (e) {
            e.preventDefault();
            KFOL.handleMultiQuote(1);
        });
    },

    /**
     * 处理多重回复和多重引用
     * @param {number} type 处理类型，1：多重回复；2：多重引用
     */
    handleMultiQuote: function (type) {
        if ($('#pd_clear_multi_quote_data').length === 0) {
            $('<a id="pd_clear_multi_quote_data" style="margin-left:7px" title="清除在浏览器中保存的多重引用数据" href="#">清除引用数据</a>')
                .insertAfter('input[name="diy_guanjianci"]').click(function (e) {
                e.preventDefault();
                localStorage.removeItem(Const.multiQuoteStorageName);
                $('input[name="diy_guanjianci"]').val('');
                if (type === 2) $('#textarea').val('');
                else $('textarea[name="atc_content"]').val('');
                alert('多重引用数据已被清除');
            });
        }
        var data = localStorage[Const.multiQuoteStorageName];
        if (!data) return;
        try {
            data = JSON.parse(data);
        }
        catch (ex) {
            return;
        }
        if (!data || $.type(data) !== 'object' || $.isEmptyObject(data)) return;
        var tid = parseInt(Tools.getUrlParam('tid')),
            fid = parseInt(Tools.getUrlParam('fid'));
        if (!tid || typeof data.tid === 'undefined' || data.tid !== tid || $.type(data.quoteList) !== 'array') return;
        if (type === 2 && !fid) return;
        var list = [];
        for (var i in data.quoteList) {
            if ($.type(data.quoteList[i]) !== 'array') continue;
            for (var j in data.quoteList[i]) {
                list.push(data.quoteList[i][j]);
            }
        }
        if (list.length === 0) {
            localStorage.removeItem(Const.multiQuoteStorageName);
            return;
        }
        var keyword = [];
        var content = '';
        if (type === 2) {
            KFOL.showWaitMsg('<strong>正在获取引用内容中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i>'
                .replace('{0}', list.length)
                , true);
            $(document).clearQueue('MultiQuote');
        }
        $.each(list, function (index, quote) {
            if (typeof quote.floor === 'undefined' || typeof quote.spid === 'undefined') return;
            if ($.inArray(quote.userName, keyword) === -1) keyword.push(quote.userName);
            if (type === 2) {
                $(document).queue('MultiQuote', function () {
                    var url = 'post.php?action=quote&fid={0}&tid={1}&pid={2}&article={3}&t={4}'
                        .replace('{0}', fid)
                        .replace('{1}', tid)
                        .replace('{2}', quote.spid)
                        .replace('{3}', quote.floor)
                        .replace('{4}', new Date().getTime());
                    $.get(url, function (html) {
                        var matches = /<textarea id="textarea".*?>((.|\n)+?)<\/textarea>/i.exec(html);
                        if (matches) content += Tools.getRemoveUnpairedBBCodeQuoteContent(Tools.htmlDecode(matches[1]).replace(/\n\n/g, '\n')) + '\n';
                        var $remainingNum = $('#pd_remaining_num');
                        $remainingNum.text(parseInt($remainingNum.text()) - 1);
                        if (index === list.length - 1) {
                            KFOL.removePopTips($('.pd_pop_tips'));
                            $('#textarea').val(content).focus();
                        }
                        else {
                            window.setTimeout(function () {
                                $(document).dequeue('MultiQuote');
                            }, 100);
                        }
                    }, 'html');
                });
            }
            else {
                content += '[quote]回 {0}楼({1}) 的帖子[/quote]\n'
                    .replace('{0}', quote.floor)
                    .replace('{1}', quote.userName);
            }
        });
        $('input[name="diy_guanjianci"]').val(keyword.join(','));
        $('form[name="FORM"]').submit(function () {
            localStorage.removeItem(Const.multiQuoteStorageName);
        });
        if (type === 2) $(document).dequeue('MultiQuote');
        else $('textarea[name="atc_content"]').val(content).focus();
    },

    /**
     * 去除引用内容中不配对的BBCode
     */
    removeUnpairedBBCodeInQuoteContent: function () {
        var $content = $('#textarea');
        var content = $content.val();
        var matches = /\[quote\](.|\r|\n)+?\[\/quote\]/.exec(content);
        if (matches) {
            var workedContent = Tools.getRemoveUnpairedBBCodeQuoteContent(matches[0]);
            if (matches[0] !== workedContent) {
                $content.val(content.replace(matches[0], workedContent));
            }
        }
    },

    /**
     * 在短消息页面中添加快速取款的链接
     */
    addFastDrawMoneyLink: function () {
        if ($('td:contains("SYSTEM")').length === 0 || $('td:contains("收到了他人转账的KFB")').length === 0) return;
        var $msg = $('.thread2 > tbody > tr:eq(-2) > td:last');
        var html = $msg.html();
        var matches = /给你转帐(\d+)KFB/i.exec(html);
        if (matches) {
            $msg.html(html.replace(/会员\[(.+?)\]通过论坛银行/, '会员[<a target="_blank" href="profile.php?action=show&username=$1">$1</a>]通过论坛银行')
                .replace(matches[0], '给你转帐<span class="pd_stat"><em>{0}</em></span>KFB'.replace('{0}', parseInt(matches[1]).toLocaleString()))
            );

            $('<br /><a title="从活期存款中取出当前转账的金额" href="#">快速取款</a> | <a title="取出银行账户中的所有活期存款" href="#">取出所有存款</a>')
                .appendTo($msg)
                .filter('a:eq(0)')
                .click(function (e) {
                    e.preventDefault();
                    KFOL.removePopTips($('.pd_pop_tips'));
                    var matches = /给你转帐(\d+)KFB/i.exec($msg.text());
                    if (!matches) return;
                    var money = parseInt(matches[1]);
                    Bank.drawCurrentDeposit(money);
                })
                .end()
                .filter('a:eq(1)')
                .click(function (e) {
                    e.preventDefault();
                    KFOL.removePopTips($('.pd_pop_tips'));
                    KFOL.showWaitMsg('正在获取当前活期存款金额...', true);
                    $.get('hack.php?H_name=bank&t=' + new Date().getTime(), function (html) {
                        KFOL.removePopTips($('.pd_pop_tips'));
                        var matches = /活期存款：(\d+)KFB<br \/>/i.exec(html);
                        if (!matches) {
                            alert('获取当前活期存款金额失败');
                            return;
                        }
                        var money = parseInt(matches[1]);
                        if (money <= 0) {
                            KFOL.showMsg('当前活期存款余额为零', -1);
                            return;
                        }
                        Bank.drawCurrentDeposit(money);
                    }, 'html');
                });

            $('a[href^="message.php?action=write&remid="]').attr('href', '#').addClass('pd_disabled_link').click(function (e) {
                e.preventDefault();
                alert('本短消息由系统发送，请勿直接回复；如需回复，请点击给你转账的用户链接，向其发送短消息');
            });
        }
    },

    /**
     * 将帖子和短消息中的绯月其它域名的链接修改为当前域名
     */
    modifyKFOtherDomainLink: function () {
        $('.readtext a, .thread2 a').each(function () {
            var $this = $(this);
            var url = $this.attr('href');
            var matches = /^(https?:\/\/(?:[\w\.]+?\.)?(?:2dgal|9gal|9baka|9moe|kfgal|2dkf|miaola)\.[\w\.]+?\/).+/i.exec(url);
            if (matches) $this.attr('href', url.replace(matches[1], Tools.getHostNameUrl()));
        });
    },

    /**
     * 添加购买帖子提醒
     */
    addBuyThreadWarning: function () {
        $('.readtext input[type="button"][value="愿意购买,支付KFB"]').each(function () {
            var $this = $(this);
            var matches = /此帖售价\s*(\d+)\s*KFB/i.exec($this.closest('legend').contents().eq(0).text());
            if (!matches) return;
            var sell = parseInt(matches[1]);
            matches = /location\.href="(.+?)"/i.exec($this.attr('onclick'));
            if (!matches) return;
            $this.data('sell', sell).data('url', matches[1]).removeAttr('onclick').click(function (e) {
                e.preventDefault();
                var $this = $(this);
                var sell = $this.data('sell');
                var url = $this.data('url');
                if (!sell || !url) return;
                if (sell < Const.minBuyThreadWarningSell || window.confirm('此贴售价{0}KFB，是否购买？'.replace('{0}', sell))) {
                    location.href = url;
                }
            });
        });
    },

    /**
     * 添加批量购买帖子的按钮
     */
    addBatchBuyThreadButton: function () {
        var $btns = $('.readtext input[type="button"][value="愿意购买,支付KFB"]');
        if ($btns.length === 0) return;
        $btns.each(function () {
            var $this = $(this);
            var sell = $this.data('sell');
            var url = $this.data('url');
            if (!sell || !url) return;
            $this.after('<input class="pd_buy_thread" style="margin-left:10px;vertical-align:middle" type="checkbox" data-sell="{0}" data-url="{1}" />'
                .replace('{0}', sell)
                .replace('{1}', url)
            );
        });
        $('<span style="margin:0 5px">|</span><a class="pd_buy_thread_btn" title="批量购买所选帖子" href="#">批量购买</a>').insertAfter('td > a[href^="kf_tidfavor.php?action=favor&tid="]')
            .filter('a').click(function (e) {
                e.preventDefault();
                KFOL.removePopTips($('.pd_pop_tips'));
                var threadList = [];
                var totalSell = 0;
                $('.pd_buy_thread:checked').each(function () {
                    var $this = $(this);
                    var url = $this.data('url');
                    var sell = parseInt($this.data('sell'));
                    if (url && !isNaN(sell)) {
                        threadList.push({url: url, sell: sell});
                        totalSell += sell;
                    }
                });
                if (threadList.length === 0) {
                    alert('请选择要购买的帖子');
                    return;
                }
                if (window.confirm('你共选择了{0}个帖子，总售价{1}KFB，均价{2}KFB，是否批量购买？'
                        .replace('{0}', threadList.length)
                        .replace('{1}', totalSell.toLocaleString())
                        .replace('{2}', Tools.getFixedNumberLocaleString(totalSell / threadList.length, 2))
                    )
                ) {
                    KFOL.showWaitMsg('<strong>正在购买帖子中...</strong><i>剩余数量：<em id="pd_remaining_num">{0}</em></i><a class="pd_stop_action" href="#">停止操作</a>'
                        .replace('{0}', threadList.length)
                        , true);
                    KFOL.buyThreads(threadList);
                }
            })
            .parent()
            .mouseenter(function () {
                $('<span style="margin-left:5px">[<a href="#">全选</a><a style="margin-left:5px" href="#">反选</a>]</span>').insertAfter($(this).find('.pd_buy_thread_btn'))
                    .find('a:first')
                    .click(function (e) {
                        e.preventDefault();
                        var $buyThread = $('.pd_buy_thread');
                        $buyThread.prop('checked', true);
                        alert('共选择了{0}项'.replace('{0}', $buyThread.length));
                    })
                    .next('a')
                    .click(function (e) {
                        e.preventDefault();
                        var totalNum = 0;
                        $('.pd_buy_thread').each(function () {
                            var $this = $(this);
                            $this.prop('checked', !$this.prop('checked'));
                            if ($this.prop('checked')) totalNum++;
                        });
                        alert('共选择了{0}项'.replace('{0}', totalNum));
                    });
            }).mouseleave(function () {
            $(this).find('.pd_buy_thread_btn').next('span').remove();
        });
    },

    /**
     * 购买指定的一系列帖子
     * @param {Object[]} threadList 购买帖子列表，threadList[n][url]：购买帖子的URL；threadList[n][sell]：购买帖子的售价
     */
    buyThreads: function (threadList) {
        var successNum = 0, failNum = 0, totalSell = 0;
        $(document).clearQueue('BuyThreads');
        $.each(threadList, function (index, thread) {
            $(document).queue('BuyThreads', function () {
                $.get(thread.url + '&t=' + new Date().getTime(), function (html) {
                    KFOL.showFormatLog('购买帖子', html);
                    if (/操作完成/.test(html)) {
                        successNum++;
                        totalSell += thread.sell;
                    }
                    else failNum++;

                    var $remainingNum = $('#pd_remaining_num');
                    $remainingNum.text(parseInt($remainingNum.text()) - 1);
                    var isStop = $remainingNum.closest('.pd_pop_tips').data('stop');
                    if (isStop) $(document).clearQueue('BuyThreads');

                    if (isStop || index === threadList.length - 1) {
                        KFOL.removePopTips($('.pd_pop_tips'));
                        if (successNum > 0) {
                            Log.push('购买帖子', '共有`{0}`个帖子购买成功'.replace('{0}', successNum), {pay: {'KFB': -totalSell}});
                        }
                        console.log('共有{0}个帖子购买成功，共有{1}个帖子购买失败，KFB-{2}'
                            .replace('{0}', successNum)
                            .replace('{1}', failNum)
                            .replace('{2}', totalSell)
                        );
                        KFOL.showMsg({
                            msg: '<strong>共有<em>{0}</em>个帖子购买成功{1}</strong><i>KFB<ins>-{2}</ins></i>'
                                .replace('{0}', successNum)
                                .replace('{1}', failNum > 0 ? '，共有<em>{0}</em>个帖子购买失败'.replace('{0}', failNum) : '')
                                .replace('{2}', totalSell)
                            , duration: -1
                        });
                    }
                    else {
                        window.setTimeout(function () {
                            $(document).dequeue('BuyThreads');
                        }, Const.defAjaxInterval);
                    }
                }, 'html');
            });
        });
        $(document).dequeue('BuyThreads');
    },

    /**
     * 添加关注和屏蔽用户以及用户备注的链接
     */
    addFollowAndBlockAndMemoUserLink: function () {
        var matches = /(.+?)\s*详细信息/.exec($('td:contains("详细信息")').text());
        if (!matches) return;
        var userName = $.trim(matches[1]);
        $('<span>[<a href="#">关注用户</a>] [<a href="#">屏蔽用户</a>]</span><br /><span>[<a href="#">添加备注</a>]</span><br />')
            .appendTo($('a[href^="message.php?action=write&touid="]').parent())
            .find('a').each(function () {
            var $this = $(this);
            if ($this.is('a:contains("备注")')) {
                var memo = '';
                for (var name in Config.userMemoList) {
                    if (name === userName) {
                        memo = Config.userMemoList[name];
                        break;
                    }
                }
                if (memo !== '') {
                    $this.text('修改备注').data('memo', memo);
                    var $info = $('.log1 > tbody > tr:last-child > td:last-child');
                    $info.html('备注：' + memo + '<br />' + $info.html());
                }
            }
            else {
                var str = '关注';
                var userList = Config.followUserList;
                if ($this.text().indexOf('屏蔽') > -1) {
                    str = '屏蔽';
                    userList = Config.blockUserList;
                }
                if (Tools.inFollowOrBlockUserList(userName, userList) > -1) {
                    $this.addClass('pd_highlight').text('解除' + str);
                }
            }
        }).click(function (e) {
            e.preventDefault();
            ConfigMethod.read();
            var $this = $(this);
            if ($this.is('a:contains("备注")')) {
                var memo = $this.data('memo');
                if (!memo) memo = '';
                var value = window.prompt('为此用户添加备注（要删除备注请留空）：', memo);
                if (value === null) return;
                if (!Config.userMemoEnabled) Config.userMemoEnabled = true;
                value = $.trim(value);
                if (value) {
                    Config.userMemoList[userName] = value;
                    $this.text('修改备注');
                }
                else {
                    delete Config.userMemoList[userName];
                    $this.text('添加备注');
                }
                $this.data('memo', value);
                ConfigMethod.write();
            }
            else {
                var str = '关注';
                var userList = Config.followUserList;
                if ($this.text().indexOf('屏蔽') > -1) {
                    str = '屏蔽';
                    userList = Config.blockUserList;
                    if (!Config.blockUserEnabled) Config.blockUserEnabled = true;
                }
                else {
                    if (!Config.followUserEnabled) Config.followUserEnabled = true;
                }
                if ($this.text() === '解除' + str) {
                    var index = Tools.inFollowOrBlockUserList(userName, userList);
                    if (index > -1) {
                        userList.splice(index, 1);
                        ConfigMethod.write();
                    }
                    $this.removeClass('pd_highlight').text(str + '用户');
                    alert('该用户已被解除' + str);
                }
                else {
                    if (Tools.inFollowOrBlockUserList(userName, userList) === -1) {
                        if (str === '屏蔽') {
                            var type = Config.blockUserDefaultType;
                            type = window.prompt('请填写屏蔽类型，0：屏蔽主题和回帖；1：仅屏蔽主题；2：仅屏蔽回帖', type);
                            if (type === null) return;
                            type = parseInt($.trim(type));
                            if (isNaN(type) || type < 0 || type > 2) type = Config.blockUserDefaultType;
                            userList.push({name: userName, type: type});
                        }
                        else {
                            userList.push({name: userName});
                        }
                        ConfigMethod.write();
                    }
                    $this.addClass('pd_highlight').text('解除' + str);
                    alert('该用户已被' + str);
                }
            }
        });
    },

    /**
     * 关注用户
     */
    followUsers: function () {
        if (Config.followUserList.length === 0) return;
        if (KFOL.isInHomePage && Config.highlightFollowUserThreadInHPEnabled) {
            $('.b_tit4 > a, .b_tit4_1 > a').each(function () {
                var $this = $(this);
                var matches = /》by：(.+)/.exec($this.attr('title'));
                if (!matches) return;
                if (Tools.inFollowOrBlockUserList(matches[1], Config.followUserList) > -1) {
                    $this.addClass('pd_highlight');
                }
            });
        }
        else if (location.pathname === '/thread.php') {
            $('a.bl[href^="profile.php?action=show&uid="]').each(function () {
                var $this = $(this);
                if (Tools.inFollowOrBlockUserList($this.text(), Config.followUserList) > -1) {
                    $this.addClass('pd_highlight');
                    if (Config.highlightFollowUserThreadLinkEnabled)
                        $this.parent('td').prev('td').prev('td').find('div > a[href^="read.php?tid="]').addClass('pd_highlight');
                }
            });
        }
        else if (location.pathname === '/read.php') {
            $('.readidmsbottom > a, .readidmleft > a').each(function () {
                var $this = $(this);
                if (Tools.inFollowOrBlockUserList($this.text(), Config.followUserList) > -1) {
                    $this.closest('.readtext').prev('.readlou').find('div:nth-child(2) > span:first-child')
                        .find('a').addBack().addClass('pd_highlight');
                }
            });
        }
        else if (location.pathname === '/guanjianci.php' || location.pathname === '/kf_share.php') {
            $('.kf_share1 > tbody > tr > td:last-child').each(function () {
                var $this = $(this);
                if (Tools.inFollowOrBlockUserList($this.text(), Config.followUserList) > -1) {
                    $this.addClass('pd_highlight');
                }
            });
        }
        else if (location.pathname === '/search.php') {
            $('.thread1 a[href^="profile.php?action=show&uid="]').each(function () {
                var $this = $(this);
                if (Tools.inFollowOrBlockUserList($this.text(), Config.followUserList) > -1) {
                    $this.addClass('pd_highlight');
                }
            });
        }
    },

    /**
     * 屏蔽用户
     */
    blockUsers: function () {
        if (Config.blockUserList.length === 0) return;
        var blockNum = 0;
        if (KFOL.isInHomePage) {
            $('.b_tit4 > a, .b_tit4_1 > a').each(function () {
                var $this = $(this);
                var matches = /》by：(.+)/.exec($this.attr('title'));
                if (!matches) return;
                var i = Tools.inFollowOrBlockUserList(matches[1], Config.blockUserList);
                if (i > -1 && Config.blockUserList[i].type < 2) {
                    blockNum++;
                    $this.parent('li').remove();
                }
            });
        }
        else if (location.pathname === '/thread.php') {
            var fid = parseInt(Tools.getUrlParam('fid'));
            if (Config.blockUserForumType === 1 && $.inArray(fid, Config.blockUserFidList) === -1) return;
            else if (Config.blockUserForumType === 2 && $.inArray(fid, Config.blockUserFidList) > -1) return;
            $('a.bl[href^="profile.php?action=show&uid="]').each(function () {
                var $this = $(this);
                var i = Tools.inFollowOrBlockUserList($this.text(), Config.blockUserList);
                if (i > -1 && Config.blockUserList[i].type < 2) {
                    blockNum++;
                    $this.closest('tr').remove();
                }
            });
        }
        else if (location.pathname === '/read.php') {
            if (Config.blockUserForumType > 0) {
                var matches = /fid=(\d+)/i.exec($('form[name="delatc"] > div:first > table > tbody > tr:nth-child(2) > td > a[href^="thread.php?fid="]').attr('href'));
                if (!matches) return;
                var fid = parseInt(matches[1]);
                if (Config.blockUserForumType === 1 && $.inArray(fid, Config.blockUserFidList) === -1) return;
                else if (Config.blockUserForumType === 2 && $.inArray(fid, Config.blockUserFidList) > -1) return;
            }
            var page = Tools.getCurrentThreadPage();
            $('.readidmsbottom > a, .readidmleft > a').each(function (index) {
                var $this = $(this);
                var i = Tools.inFollowOrBlockUserList($this.text(), Config.blockUserList);
                if (i > -1) {
                    var type = Config.blockUserList[i].type;
                    if (index === 0 && page === 1 && type > 1) return;
                    else if ((index === 0 && page !== 1 || index > 0) && type === 1) return;
                    blockNum++;
                    var $lou = $this.closest('.readtext');
                    $lou.prev('.readlou').remove().end().next('.readlou').remove().end().remove();
                }
            });
            $('.readtext fieldset:has(legend:contains("Quote:"))').each(function () {
                var $this = $(this);
                var text = $this.text();
                for (var i in Config.blockUserList) {
                    if (Config.blockUserList[i].type === 1) continue;
                    try {
                        var regex1 = new RegExp('^Quote:引用(第\\d+楼|楼主)' + Config.blockUserList[i].name + '于', 'i');
                        var regex2 = new RegExp('^Quote:回\\s*\\d+楼\\(' + Config.blockUserList[i].name + '\\)\\s*的帖子', 'i');
                        if (regex1.test(text) || regex2.test(text)) {
                            $this.html('<legend>Quote:</legend><mark class="pd_custom_tips" title="被屏蔽用户：{0}">该用户已被屏蔽</mark>'
                                .replace('{0}', Config.blockUserList[i].name)
                            );
                        }
                    }
                    catch (ex) {
                    }
                }
            });
        }
        else if (location.pathname === '/guanjianci.php' && Config.blockUserAtTipsEnabled) {
            $('.kf_share1 > tbody > tr > td:last-child').each(function () {
                var $this = $(this);
                if (Tools.inFollowOrBlockUserList($this.text(), Config.blockUserList) > -1) {
                    blockNum++;
                    $this.closest('tr').remove();
                }
            });
        }
        if (blockNum > 0) console.log('【屏蔽用户】共有{0}个项目被屏蔽'.replace('{0}', blockNum));
    },

    /**
     * 屏蔽帖子
     */
    blockThread: function () {
        if (Config.blockThreadList.length === 0) return;
        /**
         * 是否屏蔽帖子
         * @param {string} title 帖子标题
         * @param {string} userName 用户名
         * @param {number} [fid] 版块ID
         * @returns {boolean} 是否屏蔽
         */
        var isBlock = function (title, userName, fid) {
            for (var i in Config.blockThreadList) {
                var keyWord = Config.blockThreadList[i].keyWord;
                var re = null;
                if (/^\/.+\/[gimy]*$/.test(keyWord)) {
                    try {
                        re = eval(keyWord);
                    }
                    catch (ex) {
                        console.log(ex);
                        continue;
                    }
                }
                if (userName && Config.blockThreadList[i].userName) {
                    if ($.inArray(userName, Config.blockThreadList[i].userName) === -1) continue;
                }
                if (fid) {
                    if (Config.blockThreadList[i].includeFid) {
                        if ($.inArray(fid, Config.blockThreadList[i].includeFid) === -1) continue;
                    }
                    else if (Config.blockThreadList[i].excludeFid) {
                        if ($.inArray(fid, Config.blockThreadList[i].excludeFid) > -1) continue;
                    }
                }
                if (re) {
                    if (re.test(title)) return true;
                }
                else {
                    if (title.toLowerCase().indexOf(keyWord.toLowerCase()) > -1) return true;
                }
            }
            return false;
        };

        var num = 0;
        if (KFOL.isInHomePage) {
            $('.b_tit4 a, .b_tit4_1 a').each(function () {
                var $this = $(this);
                var matches = /》by：(.+)/.exec($this.attr('title'));
                var userName = '';
                if (matches) userName = matches[1];
                if (isBlock($this.text(), userName)) {
                    num++;
                    $this.parent('li').remove();
                }
            });
        }
        else if (location.pathname === '/thread.php') {
            var fid = parseInt(Tools.getUrlParam('fid'));
            if (isNaN(fid) || fid <= 0) return;
            $('.threadtit1 a[href^="read.php"]').each(function () {
                var $this = $(this);
                if (isBlock($this.text(), $this.closest('tr').find('td:last-child > a.bl').text(), fid)) {
                    num++;
                    $this.closest('tr').remove();
                }
            });
        }
        else if (location.pathname === '/read.php') {
            if (Tools.getCurrentThreadPage() !== 1) return;
            var $threadInfo = $('form[name="delatc"] > div:first > table > tbody');
            var title = $threadInfo.find('tr:first-child > td > span').text();
            if (!title) return;
            var $userName = $('.readidmsbottom > a, .readidmleft > a').eq(0);
            if ($userName.closest('.readtext').prev('.readlou').find('div:nth-child(2) > span:first-child').text() !== '楼主') return;
            var userName = $userName.text();
            if (!userName) return;
            var fid = 0;
            var matches = /fid=(\d+)/i.exec($threadInfo.find('tr:nth-child(2) > td > a[href^="thread.php?fid="]').attr('href'));
            if (matches) fid = parseInt(matches[1]);
            if (isNaN(fid) || fid <= 0) return;
            if (isBlock(title, userName, fid)) {
                num++;
                var $lou = $userName.closest('.readtext');
                $lou.prev('.readlou').remove().end().next('.readlou').remove().end().remove();
            }
        }
        if (num > 0) console.log('【屏蔽帖子】共有{0}个帖子被屏蔽'.replace('{0}', num));
    },

    /**
     * 将侧边栏修改为和手机相同的平铺样式
     */
    modifySideBar: function () {
        $('#r_menu').replaceWith(
            '<div id="r_menu" style="width:140px;color:#9999FF;font-size:14px;line-height:24px;text-align:center;border:1px #DDDDFF solid;padding:5px;overflow:hidden;">' +
            '	<span style="color:#ff9999;">游戏</span><br />' +
            '	<a href="thread.php?fid=102">游戏推荐</a> | <a href="thread.php?fid=106">新作动态</a><br />' +
            '	<a href="thread.php?fid=52">游戏讨论</a> | <a href="thread.php?fid=24">疑难互助</a><br />' +
            '	<a href="thread.php?fid=16">种子下载</a> | <a href="thread.php?fid=41">网盘下载</a><br />' +
            '	<a href="thread.php?fid=67">图片共享</a> | <a href="thread.php?fid=57">同人漫本</a><br />' +
            '	<span style="color:#ff9999;">动漫音乐</span><br />' +
            '	<a href="thread.php?fid=84">动漫讨论</a> | <a href="thread.php?fid=92">动画共享</a><br />' +
            '	<a href="thread.php?fid=127">漫画小说</a> | <a href="thread.php?fid=68">音乐共享</a><br />' +
            '	<a href="thread.php?fid=163">LIVE共享</a>  | <a href="thread.php?fid=182">转载资源</a><br />' +
            '	<span style="color:#ff9999;">综合</span><br />' +
            '	<a href="thread.php?fid=94">原创美图</a> | <a href="thread.php?fid=87">宅物交流</a><br />' +
            '	<a href="thread.php?fid=86">电子产品</a> | <a href="thread.php?fid=115">文字作品</a><br />' +
            '	<a href="thread.php?fid=96">出处讨论</a>  | <a href="thread.php?fid=36">寻求资源</a><br />' +
            '	<span style="color:#ff9999;">交流</span><br />' +
            '	<a href="thread.php?fid=5">自由讨论</a> | <a href="thread.php?fid=56">个人日记</a><br />' +
            '	<a href="thread.php?fid=98">日本语版</a>  | <a href="thread.php?fid=9">我的关注</a><br />' +
            '	<a href="thread.php?fid=4">站务管理</a><br />' +
            '	<span style="color:#ff9999;">专用</span><br />' +
            '	<a href="thread.php?fid=93">管理组区</a> | <a href="thread.php?fid=59">原创组区</a><br />' +
            '	<a href="/">论坛首页</a><br />' +
            '</div>'
        );
    },

    /**
     * 为侧边栏添加快捷导航的链接
     */
    addFastNavForSideBar: function () {
        if (!$('#r_menu').hasClass('r_cmenu')) {
            if (!Config.modifySideBarEnabled) {
                $('#r_menu').append('<a href="/">论坛首页</a><br />');
            }
            $('#r_menu > a:last').before(
                '<span style="color:#ff9999;">快捷导航</span><br />' +
                '<a href="guanjianci.php?gjc={0}">@提醒</a> | <a href="personal.php?action=post">回复</a> | <a href="kf_growup.php">神秘</a><br />'
                    .replace('{0}', KFOL.userName) +
                '<a href="kf_fw_ig_index.php">争夺</a> | <a href="kf_fw_ig_my.php">道具</a> | <a href="kf_smbox.php">盒子</a><br />' +
                '<a href="profile.php?action=modify">设置</a> | <a href="hack.php?H_name=bank">银行</a> | <a href="profile.php?action=favor">收藏</a><br />'
            );
        }
        else {
            $('#r_menu > ul > li:last-child').before(
                '<li class="r_cmenuho"><a href="JavaScript:;">快捷导航</a>' +
                '  <ul class="r_cmenu2">' +
                '    <li><a href="guanjianci.php?gjc={0}">@提醒</a></li>'.replace('{0}', KFOL.userName) +
                '    <li><a href="kf_growup.php">神秘等级</a></li>' +
                '    <li><a href="kf_fw_ig_index.php">争夺奖励</a></li>' +
                '    <li><a href="kf_fw_ig_my.php">我的道具</a></li>' +
                '    <li><a href="kf_smbox.php">神秘盒子</a></li>' +
                '    <li><a href="profile.php?action=modify">设置</a></li>' +
                '    <li><a href="hack.php?H_name=bank">银行</a></li>' +
                '    <li><a href="profile.php?action=favor">收藏</a></li>' +
                '    <li><a href="personal.php?action=post">我的回复</a></li>' +
                '  </ul>' +
                '</li>'
            );
        }
    },

    /**
     * 自动活期存款
     * @param {boolean} [isRead=false] 是否读取个人信息页面以获得当前所拥有KFB的信息
     */
    autoSaveCurrentDeposit: function (isRead) {
        if (!(Config.saveCurrentDepositAfterKfb > 0 && Config.saveCurrentDepositKfb > 0 && Config.saveCurrentDepositKfb <= Config.saveCurrentDepositAfterKfb))
            return;
        var $kfb = $('a[href="kf_givemekfb.php"][title="网站虚拟货币"]');
        /**
         * 活期存款
         * @param {number} income 当前拥有的KFB
         */
        var saveCurrentDeposit = function (income) {
            if (income < Config.saveCurrentDepositAfterKfb) return;
            var multiple = Math.floor((income - Config.saveCurrentDepositAfterKfb) / Config.saveCurrentDepositKfb);
            if (income - Config.saveCurrentDepositKfb * multiple >= Config.saveCurrentDepositAfterKfb)
                multiple++;
            var money = Config.saveCurrentDepositKfb * multiple;
            if (money <= 0 || money > income) return;
            $.post('hack.php?H_name=bank',
                {action: 'save', btype: 1, savemoney: money},
                function (html) {
                    if (/完成存款/.test(html)) {
                        Log.push('自动存款', '共有`{0}`KFB已自动存入活期存款'.replace('{0}', money));
                        KFOL.showFormatLog('自动存款', html);
                        console.log('共有{0}KFB已自动存入活期存款'.replace('{0}', money));
                        KFOL.showMsg('共有<em>{0}</em>KFB已自动存入活期存款'.replace('{0}', money));
                        if (KFOL.isInHomePage) $kfb.text('拥有{0}KFB'.replace('{0}', income - money));
                    }
                }, 'html');
        };
        if (isRead) {
            $.get('profile.php?action=show&uid={0}&t={1}'.replace('{0}', KFOL.uid).replace('{1}', new Date().getTime()), function (html) {
                var matches = /论坛货币：(\d+)\s*KFB<br \/>/i.exec(html);
                if (matches) saveCurrentDeposit(parseInt(matches[1]));
            });
        }
        else {
            var matches = /拥有(\d+)KFB/i.exec($kfb.text());
            if (matches) saveCurrentDeposit(parseInt(matches[1]));
        }
    },

    /**
     * 在神秘等级升级后进行提醒
     */
    smLevelUpAlert: function () {
        var matches = /神秘(\d+)级/.exec($('a[href="kf_growup.php"][title="用户等级和权限"]').text());
        if (!matches) return;
        var smLevel = parseInt(matches[1]);

        /**
         * 写入神秘等级数据
         * @param {number} smLevel 神秘等级
         */
        var writeData = function (smLevel) {
            TmpLog.setValue(Const.smLevelUpTmpLogName, {time: new Date().getTime(), smLevel: smLevel});
        };

        var data = TmpLog.getValue(Const.smLevelUpTmpLogName);
        if (!data || $.type(data.time) !== 'number' || $.type(data.smLevel) !== 'number') {
            writeData(smLevel);
        }
        else if (smLevel > data.smLevel) {
            var date = new Date(data.time);
            writeData(smLevel);
            Log.push('神秘等级升级', '自`{0}`以来，你的神秘等级共上升了`{1}`级 (Lv.`{2}`->Lv.`{3}`)'
                .replace('{0}', Tools.getDateString(date))
                .replace('{1}', smLevel - data.smLevel)
                .replace('{2}', data.smLevel)
                .replace('{3}', smLevel)
            );
            KFOL.showMsg('自<em>{0}</em>以来，你的神秘等级共上升了<em>{1}</em>级'
                .replace('{0}', Tools.getDateString(date))
                .replace('{1}', smLevel - data.smLevel)
            );
        }
        else if (smLevel < data.smLevel) {
            writeData(smLevel);
        }
    },

    /**
     * 在神秘系数排名发生变化时进行提醒
     */
    smRankChangeAlert: function () {
        var matches = /系数排名第\s*(\d+)\s*位/.exec($('a[href="kf_growup.php"][title="用户等级和权限"]').text());
        if (!matches) return;
        var smRank = parseInt(matches[1]);

        /**
         * 写入神秘系数排名数据
         * @param {number} smRank 神秘系数排名
         */
        var writeData = function (smRank) {
            TmpLog.setValue(Const.smRankChangeTmpLogName, {time: new Date().getTime(), smRank: smRank});
        };

        var data = TmpLog.getValue(Const.smRankChangeTmpLogName);
        if (!data || $.type(data.time) !== 'number' || $.type(data.smRank) !== 'number') {
            writeData(smRank);
        }
        else if (smRank !== data.smRank) {
            var diff = Math.floor((new Date().getTime() - data.time) / 60 / 60 / 1000);
            if (diff >= Const.smRankChangeAlertInterval) {
                var date = new Date(data.time);
                var isUp = smRank < data.smRank;
                writeData(smRank);
                Log.push('神秘系数排名变化', '自`{0}`以来，你的神秘系数排名共`{1}`了`{2}`名 (No.`{3}`->No.`{4}`)'
                    .replace('{0}', Tools.getDateString(date))
                    .replace('{1}', isUp ? '上升' : '下降')
                    .replace('{2}', Math.abs(smRank - data.smRank))
                    .replace('{3}', data.smRank)
                    .replace('{4}', smRank)
                );
                KFOL.showMsg('自<em>{0}</em>以来，你的神秘系数排名共<b style="color:{1}">{2}</b>了<em>{3}</em>名'
                    .replace('{0}', Tools.getDateString(date))
                    .replace('{1}', isUp ? '#F00' : '#393')
                    .replace('{2}', isUp ? '上升' : '下降')
                    .replace('{3}', Math.abs(smRank - data.smRank))
                );
            }
            else if (diff < 0) {
                writeData(smRank);
            }
        }
    },

    /**
     * 修改我的回复页面里的帖子链接
     */
    modifyMyPostLink: function () {
        $('.t a[href^="read.php?tid="]').each(function () {
            var $this = $(this);
            $this.attr('href', $this.attr('href').replace(/&uid=\d+#(\d+)/i, '&spid=$1'));
        });
    },

    /**
     * 在短消息页面添加选择指定短消息的按钮
     */
    addMsgSelectButton: function () {
        $('<input value="自定义" type="button" style="margin-right:3px">').insertBefore('input[type="button"][value="全选"]')
            .click(function (e) {
                e.preventDefault();
                var title = $.trim(window.prompt('请填写所要选择的包含指定字符串的短消息标题（可用|符号分隔多个标题）', '收到了他人转账的KFB|银行汇款通知|您的文章被评分|您的文章被删除'));
                if (title !== '') {
                    $('.thread1 > tbody > tr > td:nth-child(2) > a').each(function () {
                        var $this = $(this);
                        $.each(title.split('|'), function (index, key) {
                            if ($this.text().toLowerCase().indexOf(key.toLowerCase()) > -1) {
                                $this.closest('tr').find('td:last-child > input[type="checkbox"]').prop('checked', true);
                            }
                        });
                    });
                }
            }).parent().attr('colspan', 4)
            .prev('td').attr('colspan', 3);
        $('<input value="反选" type="button" style="margin-left:5px;margin-right:1px">').insertAfter('input[type="button"][value="全选"]')
            .click(function (e) {
                e.preventDefault();
                $('.thread1 > tbody > tr > td:last-child > input[type="checkbox"]').each(function () {
                    var $this = $(this);
                    $this.prop('checked', !$this.prop('checked'));
                });
            });
    },

    /**
     * 在首页帖子链接旁添加快速跳转至页末的链接
     */
    addHomePageThreadFastGotoLink: function () {
        $('.index1').on('mouseenter', 'li.b_tit4:has("a"), li.b_tit4_1:has("a")', function () {
            var $this = $(this);
            $this.css('position', 'relative')
                .prepend('<a class="pd_thread_goto" href="{0}&page=e#a">&raquo;</a>'.replace('{0}', $this.find('a').attr('href')));
        }).on('mouseleave', 'li.b_tit4:has("a"), li.b_tit4_1:has("a")', function () {
            $(this).css('position', 'static').find('.pd_thread_goto').remove();
        });
    },

    /**
     * 在首页上显示领取争夺奖励的剩余时间
     */
    showLootAwardInterval: function () {
        var timeLog = Loot.getNextLootAwardTime();
        if (!timeLog.type) return;
        var $msg = $('a[href="kf_fw_ig_index.php"]');
        if ($msg.length === 0) return;
        var diff = Tools.getTimeDiffInfo(timeLog.time);
        if (diff.hours === 0 && diff.minutes === 0 && diff.seconds === 0) return;
        if (timeLog.type === 2) {
            $msg.text('争夺奖励 (剩余{0}{1}分)'.replace('{0}', diff.hours < 1 ? '' : diff.hours + '小时').replace('{1}', diff.minutes));
        }
        else {
            diff.hours += 1;
            $msg.text('争夺奖励 (剩余{0})'.replace('{0}', diff.hours < 1 ? '1小时以内' : diff.hours + '个多小时'));
        }
        if (!Tools.getCookie(Const.autoAttackReadyCookieName))
            $msg.removeClass('indbox5').addClass('indbox6');
    },

    /**
     * 在首页上显示抽取神秘盒子的剩余时间
     */
    showDrawSmboxInterval: function () {
        var timeLog = KFOL.getNextDrawSmboxTime();
        if (timeLog.type !== 2) return;
        var $msg = $('a[href="kf_smbox.php"]');
        if ($msg.length === 0) return;
        var diff = Tools.getTimeDiffInfo(timeLog.time);
        if (diff.hours === 0 && diff.minutes === 0 && diff.seconds === 0) return;
        $msg.text('神秘盒子 (剩余{0}{1}分)'.replace('{0}', diff.hours < 1 ? '' : diff.hours + '小时').replace('{1}', diff.minutes))
            .removeClass('indbox5')
            .addClass('indbox6');
    },

    /**
     * 添加用户自定义备注
     */
    addUserMemo: function () {
        if ($.isEmptyObject(Config.userMemoList)) return;
        $('.readidmsbottom > a[href^="profile.php?action=show&uid="], .readidmleft > a').each(function () {
            var $this = $(this);
            var userName = $.trim($this.text());
            var memo = '';
            for (var name in Config.userMemoList) {
                if (name === userName) {
                    memo = Config.userMemoList[name];
                    break;
                }
            }
            if (!memo) return;
            if ($this.is('.readidmleft > a')) {
                $this.after('<span class="pd_user_memo_tips" title="备注：{0}">[?]</span>'.replace('{0}', memo));
            }
            else {
                var memoText = memo;
                var maxLength = 24;
                if (memo.length > maxLength) memoText = memoText.substring(0, maxLength) + '...';
                $this.after('<br /><span class="pd_user_memo" title="备注：{0}">({1})</span>'.replace('{0}', memo).replace('{1}', memoText));
            }
        });
    },

    /**
     * 执行自定义脚本
     * @param {number} type 脚本类型，1：脚本开始时执行；2：脚本结束时执行
     */
    runCustomScript: function (type) {
        var script = '';
        if (type === 2) script = Config.customScriptEndContent;
        else script = Config.customScriptStartContent;
        if (script) {
            try {
                eval(script);
            }
            catch (ex) {
                console.log(ex);
            }
        }
    },

    /**
     * 添加复制代码的链接
     */
    addCopyCodeLink: function () {
        $('.readtext fieldset > legend:contains("Copy code")').html('<a class="pd_copy_code" href="#">复制代码</a>');
        if ($('.pd_copy_code').length === 0) return;
        $('#alldiv').on('click', 'a.pd_copy_code', function (e) {
            e.preventDefault();
            var $fieldset = $(this).closest('fieldset');
            var content = $fieldset.data('content');
            if (content) {
                $fieldset.html('<legend><a class="pd_copy_code" href="#">复制代码</a></legend>' + content).removeData('content');
            }
            else {
                var html = $fieldset.html();
                html = html.replace(/<legend>.+?<\/legend>/i, '');
                $fieldset.data('content', html);
                html = Tools.htmlDecode(html);
                var height = $fieldset.height();
                height -= 17;
                if (height < 50) height = 50;
                if (height > 540) height = 540;
                $fieldset.html(
                    ('<legend><a class="pd_copy_code" href="#">还原代码</a></legend><textarea wrap="off" class="pd_textarea" ' +
                    'style="width:100%;height:{0}px;line-height:1.4em;white-space:pre">{1}</textarea>')
                        .replace('{0}', height)
                        .replace('{1}', html)
                );
                $fieldset.find('textarea').select().focus();
            }
        });
    },

    /**
     * 添加自动更换神秘颜色的按钮
     */
    addAutoChangeSmColorButton: function () {
        var $autoChangeSMColor = $('table div > table > tbody > tr > td:contains("自定义ID颜色")');
        $('<span class="pd_highlight">低等级没人权？没有自己喜欢的颜色？快来试试助手的<a href="#">自定义本人神秘颜色</a>的功能吧！（虽然仅限自己可见 ╮(╯▽╰)╭）</span><br />')
            .appendTo($autoChangeSMColor)
            .find('a').click(function (e) {
            e.preventDefault();
            ConfigDialog.show();
        });

        var $smColors = $autoChangeSMColor.parent('tr').nextAll('tr').not('tr:last');
        if ($smColors.find('a').length <= 1) return;
        $('<form><div id="pd_auto_change_sm_color_btns" style="margin-top:5px">' +
            '<label><input id="pd_cfg_auto_change_sm_color_enabled" class="pd_input" type="checkbox" /> 自动更换神秘颜色</label></div></form>')
            .appendTo($autoChangeSMColor)
            .find('#pd_cfg_auto_change_sm_color_enabled')
            .click(function () {
                var $this = $(this);
                var enabled = $this.prop('checked');
                if (enabled !== Config.autoChangeSMColorEnabled) {
                    ConfigMethod.read();
                    Config.autoChangeSMColorEnabled = enabled;
                    ConfigMethod.write();
                }

                if (enabled) {
                    $smColors.addClass('pd_sm_color_select').find('td:not(:has(a))').css('cursor', 'not-allowed');
                    $('<label>更换顺序 <select id="pd_cfg_auto_change_sm_color_type" style="font-size:12px"><option value="random">随机</option>' +
                        '<option value="sequence">顺序</option></select></label>' +
                        '<label>每隔 <input id="pd_cfg_auto_change_sm_color_interval" class="pd_input" style="width:25px" type="text" maxlength="5" /> 小时</label>' +
                        '<button>保存</button><button style="margin-left:3px">重置</button><br />' +
                        '<a href="#">全选</a><a style="margin-left:7px;margin-right:10px" href="#">反选</a>' +
                        '<label><input id="pd_cfg_change_all_available_sm_color_enabled" class="pd_input" type="checkbox" /> 选择当前所有可用的神秘颜色</label>')
                        .insertAfter($this.parent())
                        .filter('button:first').click(function (e) {
                            e.preventDefault();
                            var $autoChangeSMColorInterval = $('#pd_cfg_auto_change_sm_color_interval');
                            var interval = parseInt($.trim($autoChangeSMColorInterval.val()));
                            if (isNaN(interval) || interval <= 0) {
                                alert('神秘颜色更换时间间隔格式不正确');
                                $autoChangeSMColorInterval.select();
                                $autoChangeSMColorInterval.focus();
                                return;
                            }
                            var changeAllAvailableSMColorEnabled = $('#pd_cfg_change_all_available_sm_color_enabled').prop('checked');
                            var customChangeSMColorList = [];
                            $smColors.find('input[type="checkbox"]:checked').each(function () {
                                customChangeSMColorList.push(parseInt($(this).val()));
                            });
                            if (!changeAllAvailableSMColorEnabled && customChangeSMColorList.length <= 1) {
                                alert('必须选择2种或以上的神秘颜色');
                                return;
                            }
                            if (customChangeSMColorList.length <= 1) customChangeSMColorList = [];

                            var oriInterval = Config.autoChangeSMColorInterval;
                            ConfigMethod.read();
                            Config.autoChangeSMColorType = $('#pd_cfg_auto_change_sm_color_type').val().toLowerCase();
                            Config.autoChangeSMColorInterval = interval;
                            Config.changeAllAvailableSMColorEnabled = changeAllAvailableSMColorEnabled;
                            Config.customAutoChangeSMColorList = customChangeSMColorList;
                            ConfigMethod.write();
                            if (oriInterval !== Config.autoChangeSMColorInterval)
                                Tools.setCookie(Const.autoChangeSMColorCookieName, 0, Tools.getDate('-1d'));
                            alert('设置保存成功');
                        })
                        .end()
                        .filter('button:eq(1)').click(function (e) {
                            e.preventDefault();
                            ConfigMethod.read();
                            var defConfig = ConfigMethod.defConfig;
                            Config.autoChangeSMColorEnabled = defConfig.autoChangeSMColorEnabled;
                            Config.autoChangeSMColorType = defConfig.autoChangeSMColorType;
                            Config.autoChangeSMColorInterval = defConfig.autoChangeSMColorInterval;
                            Config.changeAllAvailableSMColorEnabled = defConfig.changeAllAvailableSMColorEnabled;
                            Config.customAutoChangeSMColorList = defConfig.customAutoChangeSMColorList;
                            ConfigMethod.write();
                            Tools.setCookie(Const.autoChangeSMColorCookieName, 0, Tools.getDate('-1d'));
                            TmpLog.deleteValue(Const.prevAutoChangeSMColorIdTmpLogName);
                            alert('设置已重置');
                            location.reload();
                        })
                        .end()
                        .filter('a')
                        .click(function (e) {
                            e.preventDefault();
                            if ($smColors.find('input[disabled]').length > 0) {
                                alert('请先取消勾选“选择当前所有可用的神秘颜色”复选框');
                                $('#pd_cfg_change_all_available_sm_color_enabled').focus();
                                return;
                            }
                            if ($(this).is('#pd_auto_change_sm_color_btns > a:first')) {
                                $smColors.find('input[type="checkbox"]').prop('checked', true);
                            }
                            else {
                                $smColors.find('input[type="checkbox"]').each(function () {
                                    $(this).prop('checked', !$(this).prop('checked'));
                                });
                            }
                        });

                    $smColors.find('td:has(a)').each(function () {
                        var $this = $(this);
                        var matches = /&color=(\d+)/i.exec($this.find('a').attr('href'));
                        if (matches) {
                            $this.append('<input type="checkbox" class="pd_input" value="{0}" />'.replace('{0}', matches[1]));
                        }
                    });

                    $('#pd_cfg_auto_change_sm_color_type').val(Config.autoChangeSMColorType);
                    $('#pd_cfg_auto_change_sm_color_interval').val(Config.autoChangeSMColorInterval);
                    $('#pd_cfg_change_all_available_sm_color_enabled').click(function () {
                        $smColors.find('input').prop('disabled', $(this).prop('checked'));
                    }).prop('checked', Config.changeAllAvailableSMColorEnabled).triggerHandler('click');
                    for (var i in Config.customAutoChangeSMColorList) {
                        $smColors.find('input[value="{0}"]'.replace('{0}', Config.customAutoChangeSMColorList[i])).prop('checked', true);
                    }
                }
                else {
                    $this.parent().nextAll().remove();
                    $smColors.removeClass('pd_sm_color_select').find('input').remove();
                }
            });

        $smColors.on('click', 'td', function (e) {
            if (!$(e.target).is('a')) {
                var $this = $(this);
                if ($this.find('input[disabled]').length > 0) {
                    alert('请先取消勾选“选择当前所有可用的神秘颜色”复选框');
                    $('#pd_cfg_change_all_available_sm_color_enabled').focus();
                }
                else if (!$(e.target).is('input')) {
                    $this.find('input').click();
                }
            }
        });

        if (Config.autoChangeSMColorEnabled) {
            $('#pd_cfg_auto_change_sm_color_enabled').prop('checked', true).triggerHandler('click');
        }
    },

    /**
     * 更换神秘颜色
     */
    changeSMColor: function () {
        if (!Config.changeAllAvailableSMColorEnabled && Config.customAutoChangeSMColorList.length <= 1) return;
        /**
         * 写入Cookie
         */
        var setCookie = function () {
            var nextTime = Tools.getDate('+' + Config.autoChangeSMColorInterval + 'h');
            Tools.setCookie(Const.autoChangeSMColorCookieName, nextTime.getTime(), nextTime);
        };
        console.log('自动更换神秘颜色Start');
        $.get('kf_growup.php?t=' + new Date().getTime(), function (html) {
            if (Tools.getCookie(Const.autoChangeSMColorCookieName)) return;
            var matches = html.match(/href="kf_growup\.php\?ok=2&safeid=\w+&color=\d+"/gi);
            if (matches) {
                var safeId = '';
                var safeIdMatches = /safeid=(\w+)&/i.exec(matches[0]);
                if (safeIdMatches)safeId = safeIdMatches[1];
                if (!safeId) {
                    setCookie();
                    return;
                }

                var availableIdList = [];
                for (var i in matches) {
                    var idMatches = /color=(\d+)/i.exec(matches[i]);
                    if (idMatches) availableIdList.push(parseInt(idMatches[1]));
                }

                var idList = availableIdList;
                if (!Config.changeAllAvailableSMColorEnabled) {
                    idList = [];
                    for (var i in Config.customAutoChangeSMColorList) {
                        if ($.inArray(Config.customAutoChangeSMColorList[i], availableIdList) > -1) {
                            idList.push(Config.customAutoChangeSMColorList[i]);
                        }
                    }
                }
                if (idList.length <= 1) {
                    setCookie();
                    return;
                }

                var prevId = parseInt(TmpLog.getValue(Const.prevAutoChangeSMColorIdTmpLogName));
                if (isNaN(prevId) || prevId < 0) prevId = 0;

                var nextId = 0;
                if (Config.autoChangeSMColorType.toLowerCase() === 'sequence') {
                    for (var i in idList) {
                        if (idList[i] > prevId) {
                            nextId = idList[i];
                            break;
                        }
                    }
                    if (nextId === 0) nextId = idList[0];
                }
                else {
                    for (var i in idList) {
                        if (idList[i] === prevId) {
                            idList.splice(i, 1);
                            break;
                        }
                    }
                    nextId = idList[Math.floor(Math.random() * idList.length)];
                }

                var url = 'kf_growup.php?ok=2&safeid={0}&color={1}&t={2}'
                    .replace('{0}', safeId)
                    .replace('{1}', nextId)
                    .replace('{2}', new Date().getTime());
                $.get(url, function (html) {
                    setCookie();
                    KFOL.showFormatLog('自动更换神秘颜色', html);
                    if (/等级颜色修改完毕/.test(html)) {
                        console.log('神秘颜色ID更换为：' + nextId);
                        TmpLog.setValue(Const.prevAutoChangeSMColorIdTmpLogName, nextId);
                    }
                }, 'html');
            }
            else {
                setCookie();
            }
        }, 'html');
    },

    /**
     * 在帖子页面添加更多表情的链接
     */
    addMoreSmileLink: function () {
        /**
         * 添加表情代码
         * @param {string} id 表情ID
         */
        var addSmileCode = function (id) {
            var textArea = $('textarea[name="atc_content"]').get(0);
            if (!textArea) return;
            var code = '[s:' + id + ']';
            if (typeof textArea.selectionStart !== 'undefined') {
                var prePos = textArea.selectionStart;
                textArea.value = textArea.value.substr(0, prePos) + code + textArea.value.substr(prePos);
                textArea.selectionStart = prePos + code.length;
                textArea.selectionEnd = prePos + code.length;
            }
            else {
                textArea.value += code;
            }
            if (!KFOL.isMobile) textArea.focus();
        };

        var $parent = $('input[name="diy_guanjianci"]').parent();
        $parent.on('click', 'a[href="javascript:;"]', function (e) {
            e.preventDefault();
            var id = $(this).data('id');
            if (id) addSmileCode(id);
        }).find('a[onclick^="javascript:addsmile"]').each(function () {
            var $this = $(this);
            var matches = /addsmile\((\d+)\)/i.exec($this.attr('onclick'));
            if (matches) {
                $this.data('id', matches[1]).removeAttr('onclick').attr('href', 'javascript:;');
            }
        });

        $('<a class="pd_highlight" href="#">[更多]</a>')
            .appendTo($parent)
            .click(function (e) {
                e.preventDefault();
                var $this = $(this);
                var $panel = $('#pd_smile_panel');
                if ($panel.length > 0) {
                    $this.text('[更多]');
                    $panel.remove();
                    return;
                }
                $this.text('[关闭]');

                var smileImageIdList = ['48', '35', '34', '33', '32', '31', '30', '29', '28', '27', '26', '36', '37', '47', '46', '45', '44', '43', '42', '41', '40',
                    '39', '38', '25', '24', '11', '10', '09', '08', '01', '02', '03', '04', '05', '06', '12', '13', '23', '22', '21', '20', '19', '18', '17', '16',
                    '15', '14', '07'];
                var smileCodeIdList = [57, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 45, 46, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 34, 33, 20, 19, 18, 17, 10, 11, 12,
                    13, 14, 15, 21, 22, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 16];
                var html = '';
                for (var i = 0; i < smileImageIdList.length; i++) {
                    html += '<img src="{0}/post/smile/em/em{1}.gif" alt="[表情]" data-id="{2}" />'
                        .replace('{0}', KFOL.window.imgpath)
                        .replace('{1}', smileImageIdList[i])
                        .replace('{2}', smileCodeIdList[i]);
                }
                html = '<div class="pd_panel" id="pd_smile_panel" style="width:308px;height:185px">' + html + '</div>';

                var offset = $parent.offset();
                $panel = $(html).appendTo('body');
                $panel.css('top', offset.top + $parent.height() + 4)
                    .css('left', offset.left + $parent.width() - $panel.width() + 9)
                    .on('click', 'img', function () {
                        var id = $(this).data('id');
                        if (id) addSmileCode(id);
                    });
            });
    },

    /**
     * 在首页显示VIP剩余时间
     */
    showVipSurplusTime: function () {
        /**
         * 添加VIP剩余时间的提示
         * @param {number} hours VIP剩余时间（小时）
         */
        var addVipHoursTips = function (hours) {
            $('a[href="kf_growup.php"][title="用户等级和权限"]').parent().after(
                '<div class="line"></div><div style="width:300px;"><a href="kf_vmember.php" class="indbox{0}">VIP会员 ({1})</a><div class="c"></div></div>'
                    .replace('{0}', hours > 0 ? 5 : 6)
                    .replace('{1}', hours > 0 ? '剩余' + hours + '小时' : '参与论坛获得的额外权限')
            );
        };

        var vipHours = parseInt(Tools.getCookie(Const.vipSurplusTimeCookieName));
        if (isNaN(vipHours) || vipHours < 0) {
            console.log('检查VIP剩余时间Start');
            $.get('kf_vmember.php?t=' + new Date().getTime(), function (html) {
                var hours = 0;
                var matches = /我的VIP剩余时间\s*<b>(\d+)<\/b>\s*小时/i.exec(html);
                if (matches) hours = parseInt(matches[1]);
                Tools.setCookie(Const.vipSurplusTimeCookieName, hours, Tools.getDate('+' + Const.vipSurplusTimeExpires + 'm'));
                addVipHoursTips(hours);
            }, 'html');
        }
        else {
            addVipHoursTips(vipHours);
        }
    },

    /**
     * 同步修改帖子每页楼层数量
     */
    syncModifyPerPageFloorNum: function () {
        var syncConfig = function () {
            var perPageFloorNum = parseInt($('select[name="p_num"]').val());
            if (isNaN(perPageFloorNum)) return;
            if (perPageFloorNum === 0) perPageFloorNum = 10;
            if (perPageFloorNum !== Config.perPageFloorNum) {
                Config.perPageFloorNum = perPageFloorNum;
                ConfigMethod.write();
            }
        };
        $('form#creator').submit(function () {
            ConfigMethod.read();
            syncConfig();
        });
        syncConfig();
    },

    /**
     * 显示元素的title属性提示（用于移动版浏览器）
     * @param {{}} e 点击事件
     * @param {string} title title属性
     */
    showElementTitleTips: function (e, title) {
        $('.pd_title_tips').remove();
        if (!title || !e.originalEvent) return;
        $('<div class="pd_title_tips">{0}</div>'.replace('{0}', title))
            .appendTo('body')
            .css('left', e.originalEvent.pageX - 20)
            .css('top', e.originalEvent.pageY + 15);
    },

    /**
     * 绑定包含title属性元素的点击事件（用于移动版浏览器）
     */
    bindElementTitleClick: function () {
        var excludeNodeNameList = ['A', 'IMG', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'];
        $(document).click(function (e) {
            var target = e.target;
            if (!target.title && $.inArray(target.nodeName, excludeNodeNameList) === -1 && target.parentNode && target.parentNode.title)
                target = target.parentNode;
            if (target.title && $.inArray(target.nodeName, excludeNodeNameList) === -1 && (!target.id || target.id.indexOf('wy_') !== 0) && !$(target).is('.pd_editor_btn')) {
                KFOL.showElementTitleTips(e, target.title);
            }
            else {
                $('.pd_title_tips').remove();
            }
        });
    },

    /**
     * 在首页上添加搜索类型选择框
     */
    addSearchTypeSelectBox: function () {
        var $keyWord = $('input[type="text"][name="keyword"]');
        $keyWord.css('width', '116px');
        var $searchType = $('<div class="pd_search_type"><span>标题</span><i>&#8744;</i></div>').insertAfter($keyWord);
        $searchType.click(function () {
            var $searchTypeList = $('.pd_search_type_list');
            if ($searchTypeList.length > 0) {
                $searchTypeList.remove();
                return;
            }
            $searchTypeList = $('<ul class="pd_search_type_list"><li>标题</li><li>用户名</li><li>关键词</li></ul>').appendTo('body');
            var offset = $searchType.offset();
            $searchTypeList.css('top', offset.top + $searchType.height() + 2).css('left', offset.left + 1);
            $searchTypeList.on('click', 'li', function () {
                var $this = $(this);
                var type = $.trim($this.text());
                $searchType.find('span').text(type);
                var $form = $keyWord.closest('form');
                if (type === '关键词') $form.attr('action', 'guanjianci.php?');
                else $form.attr('action', 'search.php?');
                if (type === '用户名') $keyWord.attr('name', 'pwuser');
                else if (type === '关键词') $keyWord.attr('name', 'gjc');
                else $keyWord.attr('name', 'keyword');
                $searchTypeList.remove();
                $keyWord.focus();
            });
        });
    },

    /**
     * 在帖子页面解析多媒体标签
     */
    parseMediaTag: function () {
        $('.readtext > table > tbody > tr > td').each(function () {
            var $this = $(this);
            var html = $this.html();
            if (/\[(audio|video)\](http|ftp)[^<>]+\[\/(audio|video)\]/.test(html)) {
                $this.html(
                    html.replace(/\[audio\]((?:http|ftp)[^<>]+?)\[\/audio\](?!<\/fieldset>)/g,
                        '<audio src="$1" controls="controls" preload="none" style="margin:3px 0"><a href="$1" target="_blank">$1</a></audio>'
                        )
                        .replace(/\[video\]((?:http|ftp)[^<>]+?)\[\/video\](?!<\/fieldset>)/g,
                            '<video src="$1" controls="controls" preload="none" style="max-width:{0}px;margin:3px 0"><a href="$1" target="_blank">$1</a></video>'
                                .replace('{0}', Config.adjustThreadContentWidthEnabled ? 627 : 820)
                        )
                );
            }
        });
    },

    /**
     * 在发帖页面的发帖框上添加额外的按钮
     */
    addExtraPostEditorButton: function () {
        var textArea = $('textarea[name="atc_content"]').get(0);
        if (!textArea) return;

        /**
         * 添加BBCode
         * @param {string} code BBCode
         * @param {string} selText 选择文本
         */
        var addCode = function (code, selText) {
            var startPos = selText == '' ? code.indexOf(']') + 1 : code.indexOf(selText);
            if (typeof textArea.selectionStart !== 'undefined') {
                var prePos = textArea.selectionStart;
                textArea.value = textArea.value.substr(0, prePos) + code + textArea.value.substr(textArea.selectionEnd);
                textArea.selectionStart = prePos + startPos;
                textArea.selectionEnd = prePos + startPos + selText.length;
            }
            else {
                textArea.value += code;
            }
        };

        /**
         * 获取选择文本
         * @returns {string} 选择文本
         */
        var getSelText = function () {
            return textArea.value.substr(textArea.selectionStart, textArea.selectionEnd - textArea.selectionStart);
        };

        $('<span id="wy_post" title="插入隐藏内容" data-type="hide" style="background-position:0 -280px">插入隐藏内容</span>' +
            '<span id="wy_justifyleft" title="左对齐" data-type="left" style="background-position:0 -360px">左对齐</span>' +
            '<span id="wy_justifycenter" title="居中" data-type="center" style="background-position:0 -380px">居中</span>' +
            '<span id="wy_justifyright" title="右对齐" data-type="right" style="background-position:0 -400px">右对齐</span>' +
            '<span id="wy_subscript" title="下标" data-type="sub" style="background-position:0 -80px">下标</span>' +
            '<span id="wy_superscript" title="上标" data-type="sup" style="background-position:0 -100px">上标</span>' +
            '<span class="pd_editor_btn" title="插入飞行文字" data-type="fly">F</span>' +
            '<span class="pd_editor_btn" title="插入HTML5音频" data-type="audio">A</span>' +
            '<span class="pd_editor_btn" title="插入HTML5视频" data-type="video">V</span>'
        ).appendTo('#editor-button .editor-button').click(function () {
            var $this = $(this);
            var type = $this.data('type');
            var text = '';
            switch (type) {
                case 'hide':
                    text = window.prompt('请输入神秘等级：', 5);
                    break;
                case 'audio':
                    text = Tools.convertToAudioExternalLinkUrl(window.prompt('请输入HTML5音频URL：\n（可直接输入网易云音乐单曲URL，将自动转换为外链URL）', 'http://'));
                    break;
                case 'video':
                    text = window.prompt('请输入HTML5视频URL：', 'http://');
                    break;
            }
            if (text === null) return;

            var selText = '';
            var code = '';
            switch (type) {
                case 'hide':
                    selText = getSelText();
                    code = '[hide={0}]{1}[/hide]'.replace('{0}', text).replace('{1}', selText);
                    break;
                case 'left':
                    selText = getSelText();
                    code = '[align=left]{0}[/align]'.replace('{0}', selText);
                    break;
                case 'center':
                    selText = getSelText();
                    code = '[align=center]{0}[/align]'.replace('{0}', selText);
                    break;
                case 'right':
                    selText = getSelText();
                    code = '[align=right]{0}[/align]'.replace('{0}', selText);
                    break;
                case 'fly':
                    selText = getSelText();
                    code = '[fly]{0}[/fly]'.replace('{0}', selText);
                    break;
                case 'sub':
                    selText = getSelText();
                    code = '[sub]{0}[/sub]'.replace('{0}', selText);
                    break;
                case 'sup':
                    selText = getSelText();
                    code = '[sup]{0}[/sup]'.replace('{0}', selText);
                    break;
                case 'audio':
                    code = '[audio]{0}[/audio]'.replace('{0}', text);
                    break;
                case 'video':
                    code = '[video]{0}[/video]'.replace('{0}', text);
                    break;
            }
            if (!code) return;
            addCode(code, selText);
            textArea.focus();
        }).mouseenter(function () {
            $(this).addClass('buttonHover');
        }).mouseleave(function () {
            $(this).removeClass('buttonHover');
        });
    },

    /**
     * 修复论坛错误代码
     */
    repairBbsErrorCode: function () {
        KFOL.window.is_ie = typeof KFOL.window.is_ie !== 'undefined' ? KFOL.window.is_ie : false;

        if (location.pathname === '/read.php') {
            KFOL.window.strlen = function (str) {
                var len = 0;
                var s_len = str.length = (KFOL.window.is_ie && str.indexOf('\n') != -1) ? str.replace(/\r?\n/g, '_').length : str.length;
                var c_len = 2;
                for (var i = 0; i < s_len; i++) {
                    len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? c_len : 1;
                }
                return len;
            };
        }
    },

    /**
     * 显示在购买框之外的附件图片
     */
    showAttachImageOutsideSellBox: function () {
        $('.readtext > table > tbody > tr > td').each(function () {
            var $this = $(this);
            var html = $this.html();
            if (/\[attachment=\d+\]/.test(html)) {
                var pid = $this.closest('.readtext').prev('.readlou').prev('a').attr('name');
                var tid = Tools.getUrlParam('tid');
                $this.html(
                    html.replace(/\[attachment=(\d+)\]/g,
                        ('<img src="job.php?action=download&pid={0}&tid={1}&aid=$1" alt="[附件图片]" style="max-width:550px" ' +
                        'onclick="if(this.width>=550) window.open(\'job.php?action=download&pid={0}&tid={1}&aid=$1\');" />')
                            .replace(/\{0\}/g, pid).replace(/\{1\}/g, tid)
                    )
                );
            }
        });
    },

    /**
     * 初始化
     */
    init: function () {
        if (typeof jQuery === 'undefined') return;
        var startDate = new Date();
        //console.log('KF Online助手启动');
        if (location.pathname === '/' || location.pathname === '/index.php') KFOL.isInHomePage = true;
        if (!KFOL.getUidAndUserName()) return;
        ConfigMethod.init();
        KFOL.checkBrowserType();
        KFOL.appendCss();
        KFOL.addConfigAndLogDialogLink();
        if (Config.animationEffectOffEnabled) jQuery.fx.off = true;

        if (Config.customScriptEnabled) KFOL.runCustomScript(1);
        KFOL.repairBbsErrorCode();
        KFOL.preventCloseWindowWhenActioning();
        if (Config.modifySideBarEnabled) KFOL.modifySideBar();
        if (Config.addSideBarFastNavEnabled) KFOL.addFastNavForSideBar();
        if (KFOL.isInHomePage) {
            KFOL.handleAtTips();
            KFOL.showLootAwardInterval();
            KFOL.showDrawSmboxInterval();
            KFOL.addSearchTypeSelectBox();
            if (Config.smLevelUpAlertEnabled) KFOL.smLevelUpAlert();
            if (Config.smRankChangeAlertEnabled) KFOL.smRankChangeAlert();
            if (Config.showVipSurplusTimeEnabled) KFOL.showVipSurplusTime();
            if (Config.homePageThreadFastGotoLinkEnabled) KFOL.addHomePageThreadFastGotoLink();
            if (Config.fixedDepositDueAlertEnabled && !Tools.getCookie(Const.fixedDepositDueAlertCookieName))
                Bank.fixedDepositDueAlert();
        }
        else if (location.pathname === '/read.php') {
            KFOL.fastGotoFloor();
            if (Config.adjustThreadContentWidthEnabled) KFOL.adjustThreadContentWidth();
            KFOL.adjustThreadContentFontSize();
            KFOL.showAttachImageOutsideSellBox();
            if (Config.parseMediaTagEnabled) KFOL.parseMediaTag();
            if (Config.modifyKFOtherDomainEnabled) KFOL.modifyKFOtherDomainLink();
            if (Config.customSmColorEnabled) KFOL.modifySmColor();
            if (Config.customMySmColor) KFOL.modifyMySmColor();
            if (Config.multiQuoteEnabled) KFOL.addMultiQuoteButton();
            KFOL.addFastGotoFloorInput();
            KFOL.addFloorGotoLink();
            KFOL.addCopyBuyersListLink();
            KFOL.addStatReplyersLink();
            KFOL.addBuyThreadWarning();
            if (Config.batchBuyThreadEnabled) KFOL.addBatchBuyThreadButton();
            if (Config.userMemoEnabled) KFOL.addUserMemo();
            KFOL.addCopyCodeLink();
            KFOL.addMoreSmileLink();
        }
        else if (location.pathname === '/thread.php') {
            if (Config.highlightNewPostEnabled) KFOL.highlightNewPost();
            if (Config.showFastGotoThreadPageEnabled) KFOL.addFastGotoThreadPageLink();
        }
        else if (/\/kf_fw_ig_my\.php$/i.test(location.href)) {
            Item.enhanceMyItemsPage();
        }
        else if (/\/kf_fw_ig_renew\.php$/i.test(location.href)) {
            Item.addBatchConvertEnergyAndRestoreItemsLink();
        }
        else if (/\/kf_fw_ig_renew\.php\?lv=\d+$/i.test(location.href)) {
            Item.addConvertEnergyAndRestoreItemsButton();
        }
        else if (/\/kf_fw_ig_my\.php\?lv=\d+$/i.test(location.href)) {
            Item.addSellAndUseItemsButton();
        }
        else if (/\/kf_fw_ig_my\.php\?pro=\d+&display=1$/i.test(location.href)) {
            Item.addSampleItemTips();
        }
        else if (/\/hack\.php\?H_name=bank$/i.test(location.href)) {
            Bank.addBatchTransferButton();
            Bank.handleInBankPage();
        }
        else if (/\/kf_fw_card_my\.php$/i.test(location.href)) {
            Card.addStartBatchModeButton();
        }
        else if (/\/post\.php\?action=reply&fid=\d+&tid=\d+&multiquote=true/i.test(location.href)) {
            if (Config.multiQuoteEnabled) KFOL.handleMultiQuote(2);
        }
        else if (/\/post\.php\?action=quote/i.test(location.href)) {
            KFOL.removeUnpairedBBCodeInQuoteContent();
        }
        else if (/\/message\.php\?action=read&mid=\d+/i.test(location.href)) {
            KFOL.addFastDrawMoneyLink();
            if (Config.modifyKFOtherDomainEnabled) KFOL.modifyKFOtherDomainLink();
        }
        else if (/\/profile\.php\?action=show/i.test(location.href)) {
            KFOL.addFollowAndBlockAndMemoUserLink();
        }
        else if (/\/personal\.php\?action=post/i.test(location.href)) {
            if (Config.perPageFloorNum === 10) KFOL.modifyMyPostLink();
        }
        else if (location.pathname === '/kf_growup.php') {
            KFOL.addAutoChangeSmColorButton();
        }
        else if (/\/message\.php($|\?action=receivebox)/i.test(location.href)) {
            KFOL.addMsgSelectButton();
        }
        else if (location.pathname === '/kf_fw_ig_shop.php') {
            Item.addBatchBuyItemsLink();
        }
        else if (location.pathname === '/kf_fw_ig_index.php') {
            Loot.handleInLootIndexPage();
            if (Config.customMonsterNameEnabled) Loot.customMonsterName();
        }
        else if (/\/kf_fw_ig_pklist\.php(\?l=s)?$/i.test(location.href)) {
            Loot.addBatchAttackButton();
            if (Config.customMonsterNameEnabled) Loot.customMonsterName();
            Loot.addMonsterLootInfoTips();
        }
        else if (location.pathname === '/kf_smbox.php') {
            KFOL.addSmboxLinkClickEvent();
        }
        else if (location.pathname === '/guanjianci.php') {
            KFOL.highlightUnReadAtTipsMsg();
        }
        else if (/\/profile\.php\?action=modify$/i.test(location.href)) {
            KFOL.syncModifyPerPageFloorNum();
        }
        if (location.pathname === '/post.php') {
            KFOL.addExtraPostEditorButton();
        }
        if (Config.blockUserEnabled) KFOL.blockUsers();
        if (Config.blockThreadEnabled) KFOL.blockThread();
        if (Config.followUserEnabled) KFOL.followUsers();
        if (KFOL.isMobile) KFOL.bindElementTitleClick();

        var isGetLootAwardStarted = false;
        var autoDonationAvailable = Config.autoDonationEnabled && !Tools.getCookie(Const.donationCookieName);
        if (Config.autoLootEnabled && !Loot.getNextLootAwardTime().type) {
            isGetLootAwardStarted = true;
            Loot.getLootAward(autoDonationAvailable);
        }

        if (Config.autoDrawSmbox2Enabled && !KFOL.getNextDrawSmboxTime().type) {
            KFOL.drawSmbox();
        }

        var isDonationStarted = false;
        var autoSaveCurrentDepositAvailable = Config.autoSaveCurrentDepositEnabled && KFOL.isInHomePage;
        if (autoDonationAvailable && !isGetLootAwardStarted) {
            isDonationStarted = true;
            KFOL.donation(autoSaveCurrentDepositAvailable);
        }

        if (autoSaveCurrentDepositAvailable && !isDonationStarted) KFOL.autoSaveCurrentDeposit();

        if (Config.autoLootEnabled && Config.autoAttackEnabled && Tools.getCookie(Const.autoAttackReadyCookieName)
            && !Tools.getCookie(Const.autoAttackingCookieName)) {
            Loot.checkAutoAttack();
        }

        if (Config.autoChangeSMColorEnabled && !Tools.getCookie(Const.autoChangeSMColorCookieName)) KFOL.changeSMColor();

        if (Config.autoRefreshEnabled && KFOL.isInHomePage) KFOL.startAutoRefreshMode();

        if (Config.customScriptEnabled) KFOL.runCustomScript(2);

        var endDate = new Date();
        console.log('KF Online助手加载完毕，加载耗时：{0}ms'.replace('{0}', endDate - startDate));
    }
};

KFOL.init();