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
    this.container.empty();
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
    taskFound.savePendingEdition(this);
    this.lastIdEdited = undefined;
  }

  updateTaskText(id, text) {
    let taskFound = this.tasks.find((task) => task.id === id);
    taskFound.updateText(text, this);
  }

  updateTaskCompleted(id) {
    let taskFound = this.tasks.find((task) => task.id === id);
    taskFound.updateIsFinished(this);
  }

  sortTasks() {
    this.tasks.sort(function(a, b) {
      let aIsSortedBeforeB = -1;
      let bIsSortedBeforeA = 1;
      if (a.isFinished === true && b.isFinished === false) {
        return bIsSortedBeforeA;
      } else if (a.isFinished === false && b.isFinished === true) {
        return aIsSortedBeforeB;
      } else {
        return a.text.charCodeAt(0) - b.text.charCodeAt(0);
      }
    });
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
    this.text = text;
    this.isFinished = isFinished;
    this.taskFinishedElement = new TaskFinishedElement();
    this.taskTextElement = new TaskTextElement();
    this.taskDeleteElement = new TaskDeleteElement();
  }

  toHTML() {
    this.id = this.id || 0;

    var $tarefa = $("<div />")
      .addClass("task-item")
      .attr("id", this.id)
      .append(this.taskFinishedElement.toHTML(this.isFinished))
      .append(this.taskTextElement.toHTML(this.text, this.isFinished))
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

  updateText(text, container) {

    let tarefaAlterada = {
      'descricao': text,
      'finalizada': this.isFinished
    };

    $.ajax({
      url: server + "/" + this.id,
      type: "PUT",
      data: JSON.stringify(tarefaAlterada),
      contentType: "application/json",
      success: () => {
        this.text = text;
        this.taskTextElement.updateText(text);
      },
      error: function() {
        alert("error to update task");
      },
      complete: function(data) {
        console.log(data);
        if (data.status == 204) {
          container.sortTasks();
          container.showTasks();
        }
      }
    });
  }

  updateIsFinished(container) {
    let tarefaAlterada = {
      'descricao': this.text,
      'finalizada': !this.isFinished
    };

    $.ajax({
      url: server + "/" + this.id,
      type: "PUT",
      data: JSON.stringify(tarefaAlterada),
      contentType: "application/json",
      success: () => {
        this.isFinished = !this.isFinished;
        this.taskTextElement.updateIsFinished(this.isFinished);
      },
      error: function() {
        alert("error to update task");
      },
      complete: function(data) {
        console.log(data);
        if (data.status == 204) {
          container.sortTasks();
          container.showTasks();
        }
      }
    });
  }

  startEditTextMode() {
    this.taskTextElement.startEditTextMode(this.text);
  }

  savePendingEdition(container) {
    let newText = this.taskTextElement.savePendingEdition();

    if (this.text !== newText) {
      let tarefaAlterada = {
        'descricao': newText,
        'finalizada': this.isFinished
      };

      $.ajax({
        url: server + "/" + this.id,
        type: "PUT",
        data: JSON.stringify(tarefaAlterada),
        contentType: "application/json",
        success: () => {
          this.text = newText;
        },
        error: function() {
          alert("error to update task");
        },
        complete: function(data) {
          console.log(data);
          if (data.status == 204) {
            container.sortTasks();
            container.showTasks();
          }
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

  toHTML(isFinished) {
    let $divFinalizado = $("<div />")
      .addClass("tarefa-finalizada")
      .append(this.gerarCheckox(isFinished));
    return $divFinalizado;
  }

  gerarCheckox(isFinished) {
    let $inputCheck = $("<input />")
      .addClass("check-finalizado")
      .change(onTaskFinishedChange)
      .attr("type", "checkbox");

    if (isFinished) {
      $inputCheck.attr("checked", "checked");
    }
    return $inputCheck;
  }
}

class TaskTextElement {
  constructor() {
    this.id = CreateUUID();
    this.$id = '#' + this.id;
  }

  toHTML(text, isFinished) {
    let $tarefaTexto = $("<div />")
      .attr("id", this.id)
      .addClass("tarefa-texto")
      .click(onTaskTextClick)
      .text(text);

    if (isFinished) {
      $tarefaTexto.addClass('texto-tachado');
    }
    return $tarefaTexto;
  }

  updateText(text) {
    $(this.$id).text(text);
  }

  updateIsFinished(isFinished) {
    console.log(isFinished);
    let $divTaskText = $(this.$id);
    if (isFinished) {
      $divTaskText.addClass('texto-tachado');
    } else {
      $divTaskText.removeClass('texto-tachado');
    }
  }

  startEditTextMode(text) {
    let htmlString = text.replaceAll("'", "&#39;").replaceAll('"', '&#34;');
    var content = "<input type='text' class='task-text-edit' value='" + htmlString + "'>";
    let $divTaskText = $(this.$id);
    $divTaskText.empty();
    $divTaskText.html(content);
    $(".task-text-edit").keydown(onTaskTextEditKeyEnter);
  }

  savePendingEdition() {
    let newText = $('.task-text-edit').val();
    let $divTaskText = $(this.$id);
    $divTaskText.empty();
    $divTaskText.text(newText);

    return newText;
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