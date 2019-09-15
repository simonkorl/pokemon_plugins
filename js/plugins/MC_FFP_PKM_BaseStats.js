//=============================================================================
 /*:
 * @plugindesc v1.00; This plugin changes the mechanic of stat-calculation for actors and enemies. 
 * @author FlipelyFlip
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
 * enemies. You can define your own formulas to calculate the stats for them.
 *
 *=============================================================================
 *   *  Defining BaseStats for Actors and Enemies
 *=============================================================================
 * To define the basestats for enemies is very easy. You just set the stats to
 * whatever you want. To calculate the stats just use the formula you entered.
 *
 * For actors you have to do it a bit different. Go to the Class-Tab and define
 * the stats for level 1 to the same as the stat on level 99 via the
 * "Generate Curve..."-Button.
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
 * has. Via the default formula it is not possible to have less HP than 11.
 * Since its calculated differently than the other stats in Pokemon, I splited
 * it. 
 *
 * (((param * 2 + paramIv + (paramEv/4) + 100) * level)/100) + level + 10
 *
 * param = BaseStat from the Database.
 * paramIv = IVs (Individual Values) is a value between 0 and your defined max.
 * paramEv = EVs (Effort Values) is a value between 0 and your defined max.
 * level = the level of the enemy. if MC_FFP_EnemyLevels.js is not installed, the
 * average party level will be used.
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
 * paramEv = EVs (Effort Values) is a value between 0 and your defined max.
 * level = the level of the enemy. if MC_FFP_EnemyLevels.js is not installed, the
 * average party level will be used.
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
 * FFP_EVExpAndMoneyHandler.js, you can gain EVs via defeating enemies.
 * For more information about that, check out the help file of
 * FFP_EVExpAndMoneyHandler.js.
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
        else if(paramId === 1)
            return 0;
        else {
			newCalc = eval(String(MC.PKM.BaseStats.parameters['OtherStatsFormula']));
		};
		if (!(shedinja && paramId == 0)) {
			newCalc *= this.paramRate(paramId) * this.paramBuffRate(paramId);
			newCalc = newCalc.clamp(minValue, maxValue);
        };
		return newCalc;
	} else {
	    var maxValue = this.paramMax(paramId);
		var minValue = this.paramMin(paramId);
        var newCalc = 0.0;
        var param;
        if(this.enemy().actorFix) param = $gameActors.actor(this.enemy().actorFix).paramBase(paramId);
        else console.error("actorFix error in BaseStats.js");
		var paramIv = this.paramIv(paramId);
		var paramEv = 0;
		var level = 1;
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
		if (level === 0) {
			newCalc = param;
        };
        newCalc *= this.paramRate(paramId) * this.paramBuffRate(paramId);
		return newCalc.clamp(minValue, maxValue);
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