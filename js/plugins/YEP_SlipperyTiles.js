//=============================================================================
// Yanfly Engine Plugins - Slippery Tiles
// YEP_SlipperyTiles.js
//=============================================================================

var Imported = Imported || {};
Imported.YEP_SlipperyTiles = true;

var Yanfly = Yanfly || {};
Yanfly.Slip = Yanfly.Slip || {};
Yanfly.Slip.version = 1.05

//=============================================================================
 /*:
 * @plugindesc v1.05 [v1.1]  物体 - 光滑图块
 * @author Yanfly Engine Plugins （drill_up翻译）
 *
 * @param 滑行动作
 * @type number
 * @min 0
 * @desc 滑行时角色的行走动作。根据当前角色的行走图的位置开始，0-左，1-中，2-右，>2会选择往右的其它行走图。
 * @default 2
 *
 * @param 光滑区域
 * @type number
 * @min 0
 * @max 255
 * @desc 填入R区域的ID，地图中设置的R区域将会变为光滑区域，0表示没有区域。
 * @default 0
 *
 * @param 滑行速度
 * @type number
 * @min 0
 * @desc 玩家滑行时会改变到指定速度，填入1-6，4为标准速度，0表示速度不变。
 * @default 0
 *
 * @help
 * ============================================================================
 *   插件介绍
 * ============================================================================
 * 能使得地图中指定的区域或者图块表面完全光滑，玩家走在上面会一直滑行，
 * 滑行过程不能改变方向。
 *
 * ============================================================================
 *   设定注意事项
 * ============================================================================
 * 1.只对玩家有效，NPC不能滑行。
 * 2.如果滑行时需要强制转向，需要使用插件指令。
 * （rmmv事件的转向会让角色暂停滑行，如果玩家一直按住方向键，会无视强制转向。）
 * 3.玩家可以举着花盆滑行
 * 4.玩家可以在滑行时跳跃
 *
 * ============================================================================
 *   可选设定 - 滑行转向
 * ============================================================================
 * 你可以通过插件指令临时控制滑行的方向：
 * 
 * 插件指令： >光滑图块 : 转向上方
 * 插件指令： >光滑图块 : 转向下方
 * 插件指令： >光滑图块 : 转向左方
 * 插件指令： >光滑图块 : 转向右方
 * 
 * 插件指令： >光滑图块 : 转向左上方
 * 插件指令： >光滑图块 : 转向左下方
 * 插件指令： >光滑图块 : 转向右上方
 * 插件指令： >光滑图块 : 转向右下方
 *
 * ============================================================================
 *   可选设定 - 图块注释
 * ============================================================================
 * 除了指定R区域为光滑的表面，你可以直接在图块中设置指定的图块为光滑表面。
 *
 * 图块注释： <Slippery Tile: x>
 * 图块注释： <Slippery Tile: x, x, x>
 *
 * 参数x：
 *      指定参数对应的图块ID将为光滑表面。
 *      （图块ID，指的是地形标志，默认0，你可以设置0-7。）
 *
 * ============================================================================
 *   关于Drill_up优化：
 * ============================================================================
 * [v1.1]
 * 添加了转向插件指令功能，并且使得可以斜向滑行。
 *
 * ============================================================================
 *   版本更新日志
 * ============================================================================
 *
 * Version 1.05:
 * - Updated for RPG Maker MV version 1.5.0.
 *
 * Version 1.04:
 * - Added 'Slippery Speed' plugin parameter to let you change the speed of
 * a character when its on a slippery tile.
 *
 * Version 1.03:
 * - Added anti-crash for switch checks from battle tests.
 *
 * Version 1.02:
 * - Updated for RPG Maker MV version 1.1.0.
 *
 * Version 1.01:
 * - Added failsafe for people who aren't using tilesets 
 *
 * Version 1.00:
 * - Finished Plugin!
 */
//=============================================================================

//=============================================================================
// Parameter Variables
//=============================================================================

Yanfly.Parameters = PluginManager.parameters('YEP_SlipperyTiles');
Yanfly.Param = Yanfly.Param || {};

Yanfly.Param.SlipRegion = Number(Yanfly.Parameters['光滑区域']);
Yanfly.Param.SlipFrame = Number(Yanfly.Parameters['滑行动作']);
Yanfly.Param.SlipSpeed = Number(Yanfly.Parameters['滑行速度']);

//=============================================================================
//  插件指令
//=============================================================================
var _drill_yep_SlipperyTiles_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	_drill_yep_SlipperyTiles_pluginCommand.call(this, command, args);
	if (command === '>光滑图块') {
		if(args.length == 2){
			var type = String(args[1]);
			if (type === '转向上方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 8;
			}
			if (type === '转向下方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 2;
			}
			if (type === '转向左方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 4;
			}
			if (type === '转向右方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 6;
			}
			if (type === '转向左上方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 48;
			}
			if (type === '转向左下方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 42;
			}
			if (type === '转向右上方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 68;
			}
			if (type === '转向右下方') {
				$gameSystem._drill_yep_SlipperyTiles_direction = 62;
			}
		}
	}
};

//=============================================================================
// DataManager
//=============================================================================

Yanfly.Slip.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
  if (!Yanfly.Slip.DataManager_isDatabaseLoaded.call(this)) return false;
  if (!Yanfly._loaded_YEP_SlipperyTiles) {
	  this.processSlipNotetags($dataTilesets);
    Yanfly._loaded_YEP_SlipperyTiles = true;
  }
	return true;
};

DataManager.processSlipNotetags = function(group) {
  var regexp1 = /<(?:SLIPPERY|slippery tile):[ ]*(\d+(?:\s*,\s*\d+)*)>/i;
	for (var n = 1; n < group.length; n++) {
		var obj = group[n];
		var notedata = obj.note.split(/[\r\n]+/);

    obj.slippery = [];

		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(regexp1)) {
        var array = JSON.parse('[' + RegExp.$1.match(/\d+/g) + ']');
        obj.slippery = obj.slippery.concat(array);
      }
		}
	}
};

//=============================================================================
// Game_Map
//=============================================================================

Game_Map.prototype.isSlippery = function(mx, my) {
    if ($gameParty.inBattle()) return false;
    if (this.isValid(mx, my) && this.tileset()) {
      if (Yanfly.Param.SlipRegion !== 0 &&
        this.regionId(mx, my) === Yanfly.Param.SlipRegion) return true;
      var tagId = this.terrainTag(mx, my);
      var slipTiles = this.tileset().slippery;
      return slipTiles.contains(tagId);
    }
    return false;
};

//=============================================================================
// Game_CharacterBase
//=============================================================================

Game_CharacterBase.prototype.onSlipperyFloor = function() {
    return $gameMap.isSlippery(this._x, this._y);
};

Game_CharacterBase.prototype.slipperyPose = function() {
    if (!this.onSlipperyFloor()) return false;
    if (this._stepAnime) return false;
    return true;
};

Yanfly.Slip.Game_CharacterBase_pattern = Game_CharacterBase.prototype.pattern;
Game_CharacterBase.prototype.pattern = function() {
    if (this.slipperyPose()) return Yanfly.Param.SlipFrame;
    return Yanfly.Slip.Game_CharacterBase_pattern.call(this);
};

Yanfly.Slip.Game_CharacterBase_realMoveSpeed = Game_CharacterBase.prototype.realMoveSpeed;
Game_CharacterBase.prototype.realMoveSpeed = function() {
    if (this.onSlipperyFloor() && Yanfly.Param.SlipSpeed > 0) {
      return Yanfly.Param.SlipSpeed;
    }
    return Yanfly.Slip.Game_CharacterBase_realMoveSpeed.call(this);
};

//=============================================================================
// Game_Player
//=============================================================================

Yanfly.Slip.Game_Player_isDashing = Game_Player.prototype.isDashing;
Game_Player.prototype.isDashing = function() {
    if (this.onSlipperyFloor()) return false;
    return Yanfly.Slip.Game_Player_isDashing.call(this);
};

Yanfly.Slip.Game_Player_update = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
    Yanfly.Slip.Game_Player_update.call(this, sceneActive);
    this.updateSlippery();
};

Yanfly.Slip.Game_Player_moveByInput = Game_Player.prototype.moveByInput;
Game_Player.prototype.moveByInput = function() {
	if(!$gameSystem._drill_yep_SlipperyTiles_direction){
		Yanfly.Slip.Game_Player_moveByInput.call(this);
    }
};

Game_Player.prototype.updateSlippery = function() {
    if ($gameMap.isEventRunning()) return;
    if (this.onSlipperyFloor() && !this.isMoving()) {
		$gameTemp.clearDestination();
		if($gameSystem._drill_yep_SlipperyTiles_direction != undefined){
			if($gameSystem._drill_yep_SlipperyTiles_direction < 10){
				this.moveStraight($gameSystem._drill_yep_SlipperyTiles_direction);
			}else if($gameSystem._drill_yep_SlipperyTiles_direction == 42){
				this.moveDiagonally(4, 2);
			}else if($gameSystem._drill_yep_SlipperyTiles_direction == 62){
				this.moveDiagonally(6, 2);
			}else if($gameSystem._drill_yep_SlipperyTiles_direction == 48){
				this.moveDiagonally(4, 8);
			}else if($gameSystem._drill_yep_SlipperyTiles_direction == 68){
				this.moveDiagonally(6, 8);
			}
			
		}else{
			this.moveStraight(this._direction);
		}
    }
	if(!this.onSlipperyFloor()){
		$gameSystem._drill_yep_SlipperyTiles_direction = null;
	}
};

//=============================================================================
// End of File
//=============================================================================
