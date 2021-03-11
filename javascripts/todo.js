var server = "http://www.minhastarefas-api.io/api/tarefas";
var $lastClicked;

function onTarefaDeleteClick() {

  $(this).parent('.tarefa-item')
    .off('click')
    .hide('slow', function() {
      let id = $(this).attr("data-tarefa-id");
      removeTarefa(id);
      $(this).remove();
    });
}

function newTarefa(text, id, finalizada) {
  id = id || 0;

  var $tarefa = $("<div />")
    .addClass("tarefa-item")
    .attr("data-tarefa-id", id)
    .append(gerarTarefaCheckFinalizado(finalizada))
    .append(gerarTarefaTexto(text, finalizada))
    .append(gerarTarefaDelete())
    .append(gerarTarefaClear());

  return $tarefa;
}

function gerarTarefaCheckFinalizado(finalizada) {
  let $divFinalizado = $("<div />")
    .addClass("tarefa-finalizada")
    .append(gerarCheckox(finalizada));
  return $divFinalizado;
}

function gerarCheckox(finalizada) {
  let $inputCheck = $("<input />")
    .addClass("check-finalizado")
    .change(onCheckboxFinalizadoChange)
    .attr("type", "checkbox");

  if (finalizada) {
    $inputCheck.attr("checked", "checked");
  }

  return $inputCheck;
}

function gerarTarefaTexto(texto, finalizada) {
  let $tarefaTexto = $("<div />")
    .addClass("tarefa-texto")
    .click(onTarefaItemClick)
    .text(texto);

  if (finalizada) {
    $tarefaTexto.addClass('texto-tachado');
  }

  return $tarefaTexto;
}

function gerarTarefaDelete() {
  return $("<div />")
    .addClass("tarefa-delete")
    .click(onTarefaDeleteClick);
}

function gerarTarefaClear() {
  return $("<div />")
    .addClass("clear");
}

function onTarefaKeydown(event) {
  if (event.which === 13) {
    InsertTarefa($("#tarefa").val());
    $("#tarefa").val("");
  }
}

function onCheckboxFinalizadoChange() {
  let $divTarefaItem = $(this).closest('.tarefa-item');
  let id = $divTarefaItem.attr('data-tarefa-id');
  let $divTarefaTexto = $divTarefaItem.find(".tarefa-texto");

  let isCheched = this.checked;
  if (isCheched) {
    $divTarefaTexto.addClass('texto-tachado');
  } else {
    $divTarefaTexto.removeClass('texto-tachado');
  }

  let text = $divTarefaTexto.text();
  updateTarefa(text, id, isCheched);
}

function onTarefaEditKeydown(event) {
  if (event.which === 13) {
    savePendingEdition($lastClicked);
    $lastClicked = undefined;
  }
}

function onTarefaItemClick() {
  if (!$(this).is($lastClicked)) {
    if ($lastClicked !== undefined) {
      savePendingEdition($lastClicked);
    }

    $lastClicked = $(this);
    var text = $lastClicked.text();
    console.log(text);
    var content = "<input type='text' class='tarefa-edit' value='" + text + "'>";
    $lastClicked.html(content);
    $(".tarefa-edit").keydown(onTarefaEditKeydown);
  }
}

function savePendingEdition($inputNewText) {
  let $divTarefaItem = $inputNewText.parent('.tarefa-item');
  let id = $divTarefaItem.attr('data-tarefa-id');
  console.log(id);

  let text = $divTarefaItem.find(".tarefa-edit").val();
  console.log(text);

  let isCheched = $divTarefaItem.find("input[type='checkbox']").is(":checked");
  console.log(isCheched);

  updateTarefa(text, id, isCheched);
  $divTarefaItem.before(newTarefa(text, id, isCheched));
  $divTarefaItem.remove();
}

function loadTarefas() {
  $("#tarefa-list").empty();

  $.getJSON(server)
    .done(function(data) {
      //console.log("data:	", data);
      for (var tarefa = 0; tarefa < data.length; tarefa++) {
        $("#tarefa-list").append(newTarefa(data[tarefa].descricao, data[tarefa].id,
          data[tarefa].finalizada));
      }
    });
}

function InsertTarefa(text) {
  let novaTarefa = {
    'descricao': text,
    'finalizada': false
  };

  $.ajax({
    url: server,
    type: "POST",
    data: JSON.stringify(novaTarefa),
    contentType: "application/json",
    success: function(data) {
      $("#tarefa-list").append(newTarefa(data.descricao, data.id, data.finalizada));
    },
    error: function() {
      alert("error");
    }
  });
}

function removeTarefa(id) {
  $.ajax({
    url: server + "/" + id,
    type: "DELETE"
  });
}

function updateTarefa(text, id, finalizada) {
  let tarefaAlterada = {
    'descricao': text,
    'finalizada': finalizada
  };

  $.ajax({
    url: server + "/" + id,
    type: "PUT",
    data: JSON.stringify(tarefaAlterada),
    contentType: "application/json"
  });
}

$("#tarefa").keydown(onTarefaKeydown);
loadTarefas();
