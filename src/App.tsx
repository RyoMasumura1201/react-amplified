import React, { useEffect, useReducer } from "react";

import API, { graphqlOperation } from "@aws-amplify/api";

import { createTodo } from "./graphql/mutations";
import { onCreateTodo } from "./graphql/subscriptions";
import { OnCreateTodoSubscription, Todo, CreateTodoInput } from "./API";

import "./App.css";

const QUERY = "QUERY";
const SUBSCRIPTION = "SUBSCRIPTION";

type StateType = {
  todos: Todo[];
};

type ActionType =
  | {
      type: "SUBSCRIPTION";
      todo: Todo;
    }
  | { type: "QUERY"; todos: Todo[] };

type SubscriptionValue = {
  value: {
    data: OnCreateTodoSubscription;
  };
};

const initialState: StateType = {
  todos: [],
};

const reducer = (state: StateType, action: ActionType) => {
  switch (action.type) {
    case QUERY:
      return { ...state, todos: action.todos };
    case SUBSCRIPTION:
      return { ...state, todos: [...state.todos, action.todo] };
    default:
      return state;
  }
};

async function createNewTodo() {
  const todo: CreateTodoInput = {
    name: "Todo " + Math.floor(Math.random() * 10),
  };
  await API.graphql(graphqlOperation(createTodo, { input: todo }));
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // @ts-ignore (https://github.com/aws-amplify/amplify-js/issues/7589)
    const subscription = API.graphql(graphqlOperation(onCreateTodo)).subscribe({
      next: ({ value }: SubscriptionValue) => {
        const todo = value.data.onCreateTodo;
        if (todo) {
          dispatch({ type: SUBSCRIPTION, todo });
        }
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <button onClick={createNewTodo}>Add Todo</button>
      <div>
        {state.todos.length > 0 ? (
          state.todos.map((todo: Todo) => (
            <p key={todo.id}>
              {todo.name} ({todo.createdAt})
            </p>
          ))
        ) : (
          <p>Add some todos!</p>
        )}
      </div>
    </div>
  );
}

export default App;
