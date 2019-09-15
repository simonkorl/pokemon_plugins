//=============================================================================
 /*:
 * @plugindesc v1.02; This plugin provides the ability to give enemies a predefined level. See Help for more information.
 * @author FlipelyFlip
 * 
 * @param Level PreFix
 * @desc Defines the prefix, which will be used to show the level. Default: Lvl.
 * @default "Lvl."
 *
 * @help
 * This script is an add-On to my FFP_PokemonBaseStats.js and
 * FFP_EVExpAndMoneyHandler.js. It gives you the possibility to give
 * enemies a specific level or a range of levels. Also you can set enemies
 * to have no levels and use the set stats at the database instead of calculating
 * the actual stats out of it.
 *=============================================================================
 *   *  Possible Notetags (not case-sensitive)
 *=============================================================================
 * <enemy level: x>
 * This sets the enemies level to x.
 * If you want that your enemy is at level 5 then use:
 * <enemy level: 5>
 *
 * <enemy level: x to y>
 * This sets the enemies level randomly between x and y.
 * If you want that your enemy has a level between 2 and 10 then use:
 * <enemy level: 2 to 10>
 *
 * <no level>
 * If this is used, the enemy will be at Level 0 and all his set stats at
 * the database will be used as they are. (If you give it 50 HP, it will have
 * 50 HP.)
 *
 * <average level>
 * This uses the players party average level.
 *
 * <max level: x>
 * Defines the max-level for an enemy. If the set level would've pass the max
 * level, then it would be set to the max level. It can be used with average
 * level or randomised level together.
 *
 * <min level: x>
 * Works in the opposite way as max level. Here you can define a minimum level
 * for your enemies.
 *
 * <enemy level eval>
 * code
 * </enemy level eval>
 * With this notetag you can add a JavaScript Statement to the notebox of the
 * enemy to define it's level. This will be added to the other defined level
 * notetags if used.
 *
 *=============================================================================
 *   * Changelog
 *=============================================================================
 * v1.02
 * - added the Levels to the battler at the targeting window.
 * - added a failsave if level is NaN.
 * - added lunatic mode.
 * v1.01
 * - added a failsave when level would go under 0.
 * - added a failsave for average level if FFP_BaseStats is not used.
 * v1.00
 * - released
 *
 *
 */
//=============================================================================
 
var Imported = Imported || {};
Imported.FFP_EnemyLevels = true;

var FFP = FFP || {};
FFP.EnemyLevel = FFP.EnemyLevel || {};
FFP.EnemyLevel.parameters = PluginManager.parameters('FFP_EnemyLevels');

FFP.EnemyLevel.isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!FFP.EnemyLevel.isDatabaseLoaded.call(this)) return false;
    this.getEnemyLevelNotetags($dataEnemies);
    return true;
};

DataManager.getEnemyLevelNotetags = function(group) {
	var note1 = /<(?:ENEMY LEVEL):[ ](\d+)>/i;
	var note2 = /<(?:ENEMY LEVEL):[ ](\d+)[ ](?:TO)[ ](\d+)>/i;
	var note3 = /<(?:NO LEVEL)>/i;
	var note4 = /<(?:AVERAGE LEVEL)>/i;
	var note5 = /<(?:MAX LEVEL):[ ](\d+)>/i;
	var note6 = /<(?:MIN LEVEL):[ ](\d+)>/i;
	var noteEvalStart = /<(?:ENEMY LEVEL EVAL)>/i;
	var noteEvalEnd = /<(?:\/ENEMY LEVEL EVAL)>/i;
	var level1 = 0;
	var level2 = 0;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]+/);
		obj.level = 1;
		obj.minLevel = 1;
		obj.maxLevel = 99;
		var mode = '';
		obj.customEval = '';
		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(note1)) {
				obj.level = parseInt(RegExp.$1);
			} else if (line.match(note2)) {
				level1 = parseInt(RegExp.$1);
				level2 = parseInt(RegExp.$2);
				obj.level = Math.floor(Math.random() * (level2 - level1) + level1);
			} else if (line.match(note3)) {
				obj.level = 0;
			} else if (line.match(note4)) {
				if (Imported.FFP_BaseStats) {
					obj.level = $gameParty.averageLevel();
				};
			} else if (line.match(note5)) {
				obj.maxLevel = parseInt(RegExp.$1);
			} else if (line.match(note6)) {
				obj.minLevel = parseInt(RegExp.$1);
			} else if (line.match(noteEvalStart)) {
				mode = 'in';
			} else if (line.match(noteEvalEnd)) {
				mode = '';
			} else if (mode === 'in') {
				obj.customEval = obj.customEval + line + '\n';
			};
		};
	};
};

Game_Enemy.prototype.level = function() {
	var lvl = this.enemy().level;
	var customLevel = eval(this.enemy().customEval);
	if (isNaN(lvl)) {lvl = 1;};
	if (isNaN(customLevel)) { customLevel = 0;};
	lvl += customLevel;
	if (lvl < this.enemy().minLevel) { lvl = this.enemy().minLevel;};
	if (lvl > this.enemy().maxLevel) { lvl = this.enemy().maxLevel;};
	//console.log("Level: " + lvl);
	return lvl;
};

FFP.EnemyLevel.name = Game_Enemy.prototype.name;
Game_Enemy.prototype.name = function() {
	var prefix = String(FFP.EnemyLevel.parameters['Level PreFix']);
	return FFP.EnemyLevel.name.call(this) + ' ' + prefix + this.level();
};