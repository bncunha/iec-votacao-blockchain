$('#botaoAdm').click(() => {
  $('#visao-presidente').css({"display": "block"});
  $('#visao-eleitor').css({"display": "none"});
})


$('#botaoEleitor').click(() => {
  $('#visao-presidente').css({"display": "none"});
  $('#visao-eleitor').css({"display": "flex"});
})