/*
 * template spa.js
 * Root namespace module
 * Copyright 2016 ryuji.oike@gmail.com
*/

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global spa */

const spa = (() => {
  'use strict';
  const initModule = () => {
    spa.model.initModule();
    spa.shell.initModule();
  };
  
  return { initModule: initModule };
})();
