//=============================================================================
 /*:
 * @plugindesc v1.00; This plugin changes the mechanic of stat-calculation for actors and enemie.
 * The default fomula is that of Pokemon. This plugin also implement the system of Effort Value (EV) and 
 * Individual Value(IV) in Pokemon.
 * 
 * WARNING: This plugin depends on MC_FFP_PKM_CaptureSystem, or you cannot calculate the correct stats
 * for enemies. You have to install it and place CaptureSystem above this plugin.
 *
 * @author MC, FlipelyFlip
 *
 * @param HPandMPFormula
 * @desc Calculates the values of HP and MP. Default: (((param * 2 + paramIv + (paramEv/4) + 100) * level)/100) + level + 10
 * @default (((param * 2 + paramIv + (paramEv/4)) * level)/100) + level + 10
 *
 * @param OtherStatsFormula
 * @desc Calculates the values of the other stats. Default: (((param * 2 + paramIv + (paramEv/4)) * level)/100) + 5
 * @default (((param * 2 + paramIv + (paramEv/4)) * level)/100) + 5
 *
 * @param MaxIv
 * @desc Defines the maximum value for IVs. Default: 31
 * @default 31
 *
 * @param MaxEv
 * @desc Defines the maximum value for EVs to spread them to the stats. Default: 510
 * @default 510
 *
 * @param AverageLevel
 * @desc true = AverageLevel is used if no other Level is defined, false = not used and Level is set to 1.
 * @default true
 *
 * @param UseIv
 * @desc true = Using IVs for calculation; false = it will remain 0 and therefore it won't be used.
 * @default true
 *
 * @help
 * This script provides the feature of Pokemon to define basestats for actors and
 * enemies. You can define your own formulas to calculate the stats for them too.
 * 
 *=============================================================================
 *   *  Dependencies
 *=============================================================================
 * !!! Vital (The program cannot work properly if you lack any one of these):
 * 
 * 1. MC_FFP_PKM_CaptureSystm: Without it you cannot calculate the enemies' stats
 * and the program will output an error message. This plugin can be either ABOVE
 * or BELOW this one.
 * 
 * !! Main purpose (Some functions can work without these plugins, however this
 * may cause results that betray the main design purpose of this plugin)
 * 
 * 1. MC_FFP_PKM_EnemyLevels: Without it the enemy's level is either the average
 * level of your party or 1. If you want to set the enemies' levels, install this
 * plugin first and place it ABOVE this one.
 * 2. MC_FFP_EVExpAndMoneyHandler.js: Without this, pokemon will not get EV which
 * gets away from the design purpose of the system. Place it ABOVE this one.
 * 
 *=============================================================================
 *   *  Defining BaseStats for Actors and Enemies
 *=============================================================================
 * To define the basestats for enemies, you can do it in two ways.
 * 1. Install MC_FFP_PKM_EnemyLevels.js and set the enemy's level tag as <no level>
 * and then set the stats through enemy's setting interface.
 * 2. Install MC_FFP_PKM_CaptureSystem.js and set the enemy's <actor fix:>, use
 * MC_FFP_PKM_EnemyLevels.js to set the level of enemy.
 *
 * For actors, go to the Class-Tab and define
 * the stats for level 1 to **the same as** the stat on level 99 via the
 * "Generate Curve..."-Button. The level will follow the current level of actor.
 *
 *=============================================================================
 *   *  Possible Notetags (not case-sensitive)
 *=============================================================================
 * <shedinja> or <ninjatom>
 * This is used to define that a character will always have 1 HP. It doesn't
 * matter what level he is or what his basestat would be
 * 
 *=============================================================================
 *   *  HP and MP Formula
 *=============================================================================
 * This formula is used to calculate the actual HP and MP an actor or an enemy
 * has.
 *
 * (((param * 2 + paramIv + (paramEv/4) + 100) * level)/100) + level + 10
 *
 * param = BaseStat from the Database.
 * paramIv = IVs (Individual Values) is a value between 0 and your defined max.
 * This will be assigned randomly between 0 and IVmax
 * paramEv = EVs (Effort Values) is a value between 0 and your defined max.
 * This can be gained from MC_FFP_PKM_EVExpAndMoneyHandler
 * level = the level of the enemy. if MC_FFP_PKM_EnemyLevels.js is not installed, 
 * the level will be either the average of the party or 1.
 *
 * You can define your formula however you want.
 * 
 *=============================================================================
 *   *  Other Stats Formula
 *=============================================================================
 * This formula is used to calculate the actual ATK, DEF, MAG, MDF, AGI and LUK
 * for the actors and the enemies.
 *
 * (((param * 2 + paramIv + (paramEv/4)) * level)/100) + 5
 *
 * param = BaseStat from the Database.
 * paramIv = IVs (Individual Values) is a value between 0 and your defined max.
 * This will be assigned randomly between 0 and IVmax
 * paramEv = EVs (Effort Values) is a value between 0 and your defined max.
 * This can be gained from MC_FFP_PKM_EVExpAndMoneyHandler
 * level = the level of the enemy. if MC_FFP_PKM_EnemyLevels.js is not installed, 
 * the level will be either the average of the party or 1.
 *
 * You can define your formula however you want.
 *
 *=============================================================================
 *   *  MaxIv
 *=============================================================================
 * The maximum amount that the IV can reach. Default it's 31 just like in
 * Pokemon.
 * If UseIv is false, the IVs will be automatically set to 0. If UseIv is true
 * the IV would be a random number between 0 and 31.
 *
 *=============================================================================
 *   *  MaxEv
 *=============================================================================
 * The maximum amount that the EV can reach. Default it's 510 just like in
 * Pokemon.
 * If you wish to not use it, just ignore it. If you have the
 * MC_FFP_PKM_EVExpAndMoneyHandler.js, you can gain EVs via defeating enemies.
 * For more information about that, check out the help file of
 * MC_FFP_EVExpAndMoneyHandler.js.
 *
 *
 */
//=============================================================================

var Imported = Imported || {};
Imported.MC_FFP_PKM_BaseStats = true;

var MC = MC || {};
MC.PKM.BaseStats = MC.PKM.BaseStats || {};
MC.PKM.BaseStats.parameters = PluginManager.parameters('MC_FFP_PKM_BaseStats');

Game_Party.prototype.lowestLevel = function() {
    return Math.min.apply(null, this.members().map(function(actor) {
        return actor.level;
    }));
};

Game_Party.prototype.averageLevel = function() {
	var level = 0;
	var average = 0.0;
	var roundedAverage = 0;
	this.members().map(function(actor) {
		level += actor.level;
	});
	average = level / this.size();
	//console.log(average);
	roundedAverage = Math.round(average.clamp(1,99));
	return roundedAverage;
}

Game_BattlerBase.prototype.initMembers = function() {
    this._hp = 1;
    this._mp = 0;
    this._tp = 0;
    this._hidden = false;
    this.clearParamPlus();
    this.clearStates();
    this.clearBuffs();
	this.clearParamEquip();
	this.setParamIv();
};

Game_BattlerBase.prototype.clearParamEquip = function() {
    this._paramEquip = [0,0,0,0,0,0,0,0];
};

Game_BattlerBase.prototype.setParamIv = function() {
	this._iv = [0,0,0,0,0,0,0,0];
	if (eval(String(MC.PKM.BaseStats.parameters['UseIv']))) {
		var maxIv = parseInt(eval(String(MC.PKM.BaseStats.parameters['MaxIv'])));
		for (var i = 0; i < 8; i++) {
			this._iv[i] = Math.round((Math.random() * maxIv).clamp(0,maxIv));
		};
	};
};


Game_BattlerBase.prototype.paramEquip = function(paramId) {
    return this._paramPlus[paramId];
};

Game_BattlerBase.prototype.paramIv = function(paramId) {
	return this._iv[paramId];
};

Game_BattlerBase.prototype.param = function(paramId) {
	if (this.isActor()) {
		var maxValue = this.paramMax(paramId);
		var minValue = this.paramMin(paramId);
        var param = this.paramBase(paramId);
		var paramIv = this.paramIv(paramId);
		var paramEv = this.paramPlus(paramId);
		var level = this._level;
		var newCalc = 0;
		var note1 = /<(?:SHEDINJA)>/i;
		var note2 = /<(?:NINJATOM)>/i;
		var shedinja = false;
        var notedata = this.actor().note.split(/[\r\n]+/);
		for (var i = 0; i < notedata.length; i++) {
			var line = notedata[i];
			if (line.match(note1) || line.match(note2)) {
				shedinja = true;
			};
		};
				
		if (paramId < 1) {
			if (shedinja) {
				newCalc = 1;
			} else {
                newCalc = eval(String(MC.PKM.BaseStats.parameters['HPandMPFormula']));
            }
        } 
        else if(paramId === 1){
            return 0;
        }
        else {
			newCalc = eval(String(MC.PKM.BaseStats.parameters['OtherStatsFormula']));
		};
		if (!(shedinja && paramId == 0)) {
			newCalc *= this.paramRate(paramId) * this.paramBuffRate(paramId);
			newCalc = newCalc.clamp(minValue, maxValue);
        };
		return Math.floor(newCalc);
	} else {
	    var maxValue = this.paramMax(paramId);
		var minValue = this.paramMin(paramId);
        var newCalc = 0.0;
        var param;
        /*
        This part use @param actorFix in MC_FFP_PKM_CaptureSystem.js to calculate the parameters
        for emenies.
        */
        if(this.enemy().actorFix){
            param = $gameActors.actor(this.enemy().actorFix).paramBase(paramId);
        }
        else {
            console.error("actorFix error in BaseStats.js. This may happen either\
            you did't place MC_FFP_PKM_CaptureSystem above this plugin \
            or you did't assign <enemy level:> in enemies' desciption");
        }
		var paramIv = this.paramIv(paramId);
        var paramEv = 0;
        
        var level = 1;
        //The level is calculated by the pre-set level or the average level of the party
		if (Imported.MC_FFP_PKM_EnemyLevels) {
			level = this.level();
		} else if (eval(MC.PKM.BaseStats.parameters['AverageLevel'])) {
			level = $gameParty.averageLevel();
		};
		
		if (paramId <= 1) {
            newCalc = eval(String(MC.PKM.BaseStats.parameters['HPandMPFormula']));
		} else {
			newCalc = eval(String(MC.PKM.BaseStats.parameters['OtherStatsFormula']));
		};
		if (level === 0) { // if the enemy is set no level
			newCalc = param;
        };
        newCalc *= this.paramRate(paramId) * this.paramBuffRate(paramId);
		return Math.floor(newCalc.clamp(minValue, maxValue));
	};
	return 0;
};

Game_BattlerBase.prototype.paramIv = function(paramId) {
	var value = this._iv[paramId];
	return value;
};

Game_Actor.prototype.paramPlus = function(paramId) {
    var value = Game_Battler.prototype.paramPlus.call(this, paramId);
    return value;
};

Game_Actor.prototype.paramEquip = function(paramId) {
	var value = Game_Battler.prototype.paramEquip.call(this, paramId);
	var equips = this.equips();
	for (var i = 0; i < equips.length; i++) {
		var item = equips[i];
		if (item) {
			value += item.params[paramId];
		};
	};
	return value;
};

Game_Actor.prototype.totalEv = function() {
	var total = 0;
	for (var i = 0; i < this._paramPlus.length; i++) {
		total += this._paramPlus[i];
	};
	return total;
};

Game_Actor.prototype.maxEv = function() {
	return parseInt(eval(String(MC.PKM.BaseStats.parameters['maxEv'])));
};