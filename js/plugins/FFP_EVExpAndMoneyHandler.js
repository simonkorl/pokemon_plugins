//=============================================================================
 /*:
 * @plugindesc v1.01; This plugin provides the ability to add EV to an actor and uses the Pokemon Formulas for Money and Exp.
 * @author FlipelyFlip
 *
 * @param MoneyFormula
 * @desc Determines the amount of Money which is gained. See Help for more! Default: (level * baseGold * a)
 * @default (level * baseGold * a)
 *
 * @param ExpFormula
 * @desc Determines the amount of Exp which is gained. See Help for more! Default: ((a * baseExp * level) / 7) 
 * @default ((a * baseExp * level) / 7)
 *
 * @param AverageLevel
 * @desc true = AverageLevel is used if no other Level is defined, false = not used and Level is set to 1.
 * @default true
 *
 * @help
 * This plugin is an add-on to my other plugin called FFP_PokemonBaseStats.js.
 * This one here provides the possibility to use custom money and exp-formulas.
 * Also it has the possibility to give the actors EVs. EVs are specific stats in
 * Pokemon and are gained after defeating a Pokemon. These EVs are added to the
 * actors stats.
 *
 *=============================================================================
 *   *  Possible Notetags (not case-sensitive)
 *=============================================================================
 * Here are all the possible Notetags for the Enemy-Notebox. They can't be used
 * anywhere else than except there.
 *
 * <stat: x>
 * stat = The Name of the stat (listed below) used for the EV to gain.
 * x = The amount to increase the EV of an actor.
 *
 * Possible Stats:
 *
 * HP => hp, maxhp, max hp, kp, maxkp, max kp
 * MP => mp, maxmp, max mp, sp, maxsp, max sp
 * ATK => atk, angr
 * DEF => def, vert
 * MAT => mat, spatk, sp atk, spangr, sp angr
 * MDF => mdf, spdef, sp def, spvert, sp vert
 * AGI => agi, init, spe
 * LUK => luk
 *
 *=============================================================================
 *   *  MoneyFormula
 *=============================================================================
 * This formula is used to determine how many Money the actors gain after
 * defeating an enemy. The baseformula is taken from Pokemon. The formula
 * used here is:
 *		prizeMoney = level * baseGold * a
 * level = The level of the enemy. If any EnemyLevel Script is installed, you
 * can replace this level with the level used in the script.
 * If it's used with my FFP_EnemyLevels.js yuo can leave this level as it is.
 * baseGold = The amount of gold defined in the database for the enemy.
 * a = Notetag-Modificator (do not remove if you want to keep it in your formula)
 *
 * Notetag used: <Gold: x> or <gold: x> or <Money: x> or <money: x>
 * x is the number used to modify the given money. It can be a float-number.
 *
 *=============================================================================
 *   *  ExpFormula
 *=============================================================================
 * This formula is used to determine how many EXP the actors gain after defeating
 * an enemy. The baseformula is taken from Pokemon. The formula used here is:
 *		totalExp = ((a * baseExp * level) / 7)
 * a = Notetag-Modificator (do not remove if you want to keep it in your formula)
 * baseExp = base Exp defined in the database for the enemy.
 * level = The level of the enemy. If any EnemyLevel Script is installed, you
 * can replace this level with the level used in the script.
 * These 3 are divided by 7 because it's done in pokemon too.
 *
 * Notetags used: <EXP: x> or <exp: x> or <EP: x> or <ep: x>
 * x is the number used to modify the received exp. It can be a float-number.
 *
 *
 *
 */
//=============================================================================
var Imported = Imported || {};
Imported.FFP_EVExpAndMoneyHandler = true;

var FFP = FFP || {};
FFP.BattleEndHandler = FFP.BattleEndHandler || {};

FFP.BattleEndHandler.parameters = PluginManager.parameters('FFP_EVExpAndMoneyHandler');

Game_Enemy.prototype.exp = function() {
	var baseExp = this.enemy().exp;
	var a = 1;
	var level = 1;
	var note = /<(.*):[ ](\d*\.\d+)>/i;
	var notedata = this.enemy().note.split(/[\r\n]+/);
	
	if (Imported.FFP_EnemyLevels) {
		level = this.level();
	} else if (eval(FFP.BattleEndHandler.parameters['AverageLevel'])) {
		level = $gameParty.averageLevel();
	};
	for (var i = 0; i < notedata.length; i++) {
		var line = notedata[i];
		if (line.match(note)) {
			var stat = String(RegExp.$1).toUpperCase();
			var value = parseFloat(RegExp.$2);
			switch(stat) {
			case 'EXP':
			case 'EP':
				a = value;
				break;
			};
		};
	};
	
    var new_exp = 0;
	
	new_exp = parseInt(eval(String(FFP.BattleEndHandler.parameters['ExpFormula']))); //((a*b*l)/7);
	
	return new_exp;
};

Game_Enemy.prototype.ev = function() {
	var note = /<(.*):[ ](\d+)>/i;
	var notedata = this.enemy().note.split(/[\r\n]+/);
	var ev = [0,0,0,0,0,0,0,0];
	
	for (var i = 0; i < notedata.length; i++) {
		var line = notedata[i];
		if (line.match(note)) {
			var stat = String(RegExp.$1).toUpperCase();
			var value = parseInt(RegExp.$2);
			switch (stat) {
			case 'HP':
			case 'MAXHP':
		    case 'MAX HP':
			case 'KP':
			case 'MAXKP':
			case 'MAX KP':
				ev[0] += value;
				break;
			case 'MP':
			case 'MAXMP':
			case 'MAX MP':
			case 'SP':
			case 'MAXSP':
			case 'MAX SP':
				ev[1] += value;
				break;
			case 'ATK':
			case 'ANGR':
				ev[2] += value;
				break;
			case 'DEF':
			case 'VERT':
				ev[3] += value;
				break;
			case 'MAT':
			case 'SPATK':
			case 'SP ATK':
			case 'SPANGR':
			case 'SP ANGR':
				ev[4] += value;
				break;
			case 'MDF':
			case 'SPDEF':
			case 'SP DEF':
			case 'SPVERT':
			case 'SP VERT':
				ev[5] += value;
				break;
			case 'SPD':
			case 'AGI':
			case 'SPE':
			case 'INIT':
				ev[6] += value;
				break;
			case 'LUK':
				ev[7] += value;
				break;
			};
		};
	};
	$gameParty.battleMembers().map(function(actor) {
		if (actor.totalEv() < (actor.maxEv())) {
			for (var i = 0; i < ev.length; i++) {
				if (!actor.isDead()) {
					if (actor._paramPlus[i] < actor.maxEv()) {
						actor._paramPlus[i] += ev[i];
					};
				};
			};
		};
	});
};

Game_Enemy.prototype.gold = function() {
	var baseGold = this.enemy().gold;
	var a = 1;
	var level = 1;
	var newGoldValue = 0;
	
	if (Imported.FFP_EnemyLevels) {
		level = this.level();
	} else if (Boolean(FFP.BattleEndHandler.parameters['AverageLevel'])) {
		level = $gameParty.averageLevel();
	};
	
	var note = /<(.*):[ ](\d*\.\d+)>/i;
	var notedata = this.enemy().note.split(/[\r\n]+/);
	
	for (var i = 0; i < notedata.length; i++) {
	var line = notedata[i];
		if (line.match(note)) {
			var stat = String(RegExp.$1).toUpperCase();
			var value = parseFloat(RegExp.$2);
			switch(stat) {
			case 'GOLD':
			case 'MONEY':
				a = value;
				break;
			};
		}
	}
	
	newGoldValue = parseInt(eval(String(FFP.BattleEndHandler.parameters['MoneyFormula'])));
		
    return newGoldValue;
};

FFP.BattleEndHandler.makeRewardsEvEnd = BattleManager.makeRewards;
BattleManager.makeRewards = function() {
	FFP.BattleEndHandler.makeRewardsEvEnd.call(this);
	this._rewards.ev = $gameTroop.evTotal();
};

Game_Troop.prototype.evTotal = function() {
    return this.deadMembers().reduce(function(r, enemy) {
        return r + enemy.ev();
    }, 0);
};