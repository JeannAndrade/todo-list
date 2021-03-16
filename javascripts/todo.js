var server = "http://www.minhastarefas-api.io/api/tarefas";
var taskManager;

class TaskManager {
  constructor(containerName) {
    this.tasks = [];
    this.container = $("#" + containerName);
    this.lastIdEdited = undefined;
  }

  addTask(id, text, isFinished) {
    let newTask = new Task(id, text, isFinished);
    this.tasks.push(newTask);
  }

  showTasks() {
    this.tasks.forEach((task) => this.container.append(task.toHTML()));
  }

  showTask(id) {
    let taskFound = this.tasks.find((task) => task.id === id);
    this.container.append(taskFound.toHTML());
  }

  createTask(text) {
    let newTaskDto = {
      'descricao': text,
      'finalizada': false
    };

    $.ajax({
      url: server,
      type: "POST",
      data: JSON.stringify(newTaskDto),
      contentType: "application/json",
      success: (data) => {
        let taskCreated = new Task(data.id, data.descricao, data.finalizada);
        this.tasks.push(taskCreated);
        this.showTask(taskCreated.id);
      },
      error: function() {
        alert("error");
      }
    });
  }

  startEditTextMode(id) {
    if (this.lastIdEdited !== undefined && this.lastIdEdited !== id) {
      this.savePendingEdition(this.lastIdEdited);
    }

    if (this.lastIdEdited !== id) {
      this.lastIdEdited = id;
      let taskFound = this.tasks.find((task) => task.id === id);
      taskFound.startEditTextMode();
    }
  }

  savePendingEdition(id) {
    let taskFound = this.tasks.find((task) => task.id === id);
    taskFound.savePendingEdition();
    this.lastIdEdited = undefined;
  }

  updateTaskText(id, text) {
    let taskFound = this.tasks.find((task) => task.id === id);
    taskFound.updateText(text);
  }

  updateTaskCompleted(id) {
    let taskFound = this.tasks.find((task) => task.id === id);
    taskFound.updateIsFinished();
  }

  deleteTask(id) {
    console.log(id);
    $.ajax({
      url: server + "/" + id,
      type: "DELETE",
      success: () => {
        let taskFound = this.tasks.find((task) => task.id === id);
        taskFound.deleteDOMElement();
        let taskFiltered = this.tasks.filter((task) => task.id !== id);
        this.tasks = taskFiltered;
      },
      error: function() {
        alert("error to delete task");
      }
    });
  }
}

class Task {
  constructor(id, text, isFinished) {
    this.id = id;
    this.taskFinishedElement = new TaskFinishedElement(isFinished);
    this.taskTextElement = new TaskTextElement(text, isFinished);
    this.taskDeleteElement = new TaskDeleteElement();
  }

  toHTML() {
    this.id = this.id || 0;

    var $tarefa = $("<div />")
      .addClass("task-item")
      .attr("id", this.id)
      .append(this.taskFinishedElement.toHTML())
      .append(this.taskTextElement.toHTML())
      .append(this.taskDeleteElement.toHTML())
      .append(this.gerarTarefaClear());
    return $tarefa;
  }

  deleteDOMElement() {
    let $element = $("#" + this.id);
    $element
      .off('click')
      .hide('slow', function() {
        $element.remove();
      });
  }

  updateText(text) {

    let tarefaAlterada = {
      'descricao': text,
      'finalizada': this.taskFinishedElement.isFinished
    };

    $.ajax({
      url: server + "/" + this.id,
      type: "PUT",
      data: JSON.stringify(tarefaAlterada),
      contentType: "application/json",
      success: () => {
        this.taskTextElement.updateText(text);
      },
      error: function() {
        alert("error to update task");
      }
    });
  }

  updateIsFinished() {
    let tarefaAlterada = {
      'descricao': this.taskTextElement.text,
      'finalizada': !this.taskFinishedElement.isFinished
    };

    $.ajax({
      url: server + "/" + this.id,
      type: "PUT",
      data: JSON.stringify(tarefaAlterada),
      contentType: "application/json",
      success: () => {
        this.taskTextElement.updateIsFinished();
        this.taskFinishedElement.updateIsFinished();
      },
      error: function() {
        alert("error to update task");
      }
    });
  }

  startEditTextMode() {
    this.taskTextElement.startEditTextMode();
  }

  savePendingEdition() {
    let originalText = this.taskTextElement.text;
    this.taskTextElement.savePendingEdition();
    let newText = this.taskTextElement.text;

    if (originalText !== newText) {
      let tarefaAlterada = {
        'descricao': newText,
        'finalizada': this.taskFinishedElement.isFinished
      };

      $.ajax({
        url: server + "/" + this.id,
        type: "PUT",
        data: JSON.stringify(tarefaAlterada),
        contentType: "application/json",
        error: function() {
          alert("error to update task");
        }
      });
    }
  }

  gerarTarefaClear() {
    return $("<div />")
      .addClass("clear");
  }
}

class TaskFinishedElement {
  constructor(isFinished) {
    this.isFinished = isFinished;
  }

  toHTML() {
    let $divFinalizado = $("<div />")
      .addClass("tarefa-finalizada")
      .append(this.gerarCheckox());
    return $divFinalizado;
  }

  gerarCheckox() {
    let $inputCheck = $("<input />")
      .addClass("check-finalizado")
      .change(onTaskFinishedChange)
      .attr("type", "checkbox");

    if (this.isFinished) {
      $inputCheck.attr("checked", "checked");
    }
    return $inputCheck;
  }

  updateIsFinished() {
    this.isFinished = !this.isFinished;
  }
}

class TaskTextElement {
  constructor(text, isFinished) {
    this.text = text;
    this.isFinished = isFinished;
    this.id = CreateUUID();
    this.$id = '#' + this.id;
  }

  toHTML() {
    let $tarefaTexto = $("<div />")
      .attr("id", this.id)
      .addClass("tarefa-texto")
      .click(onTaskTextClick)
      .text(this.text);

    if (this.isFinished) {
      $tarefaTexto.addClass('texto-tachado');
    }
    return $tarefaTexto;
  }

  updateText(text) {
    this.text = text;
    $(this.$id).text(text);
  }

  updateIsFinished() {
    this.isFinished = !this.isFinished;
    let $divTaskText = $(this.$id);
    if (this.isFinished) {
      $divTaskText.addClass('texto-tachado');
    } else {
      $divTaskText.removeClass('texto-tachado');
    }
  }

  startEditTextMode() {
    let htmlString = this.text.replaceAll("'", "&#39;").replaceAll('"', '&#34;');
    var content = "<input type='text' class='task-text-edit' value='" + htmlString + "'>";
    let $divTaskText = $(this.$id);
    $divTaskText.empty();
    $divTaskText.html(content);
    $(".task-text-edit").keydown(onTaskTextEditKeyEnter);
  }

  savePendingEdition() {
    this.text = $('.task-text-edit').val();
    let $divTaskText = $(this.$id);
    $divTaskText.empty();
    $divTaskText.text(this.text);
  }
}

class TaskDeleteElement {
  constructor(text, isFinished) {
    this.text = text;
    this.isFinished = isFinished;
  }

  toHTML() {
    return $("<div />")
      .addClass("tarefa-delete")
      .click(onTaskDeleteClick);
  }
}


function CreateUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

function onTaskDeleteClick() {
  let $idTaskItem = $(this).closest('.task-item').attr("id");
  taskManager.deleteTask($idTaskItem);
}

function onTaskFinishedChange() {
  let $idTaskItem = $(this).closest('.task-item').attr("id");
  taskManager.updateTaskCompleted($idTaskItem);
}

function onTaskTextClick() {
  let $idTaskItem = $(this).closest('.task-item').attr("id");
  taskManager.startEditTextMode($idTaskItem);
}

function onTaskTextEditKeyEnter(event) {
  if (event.which === 13) {
    let $idTaskItem = $(this).closest('.task-item').attr("id");
    taskManager.savePendingEdition($idTaskItem);
  }
}

function loadTarefas() {
  $("#task-list").empty();
  $.getJSON(server)
    .done(function(data) {
      taskManager = new TaskManager("task-list");
      data.forEach((task) => taskManager.addTask(task.id, task.descricao, task.finalizada));
      taskManager.showTasks();
    });
}

loadTarefas();

function onNewTaskInputTextKeyEnter(event) {
  if (event.which === 13) {
    taskManager.createTask($("#new-task-input-text").val());
    $("#new-task-input-text").val("");
  }
}

$("#new-task-input-text").keydown(onNewTaskInputTextKeyEnter);