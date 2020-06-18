import React, { useState } from 'react';
import { Task } from './Task';
import { IonList, IonToast } from '@ionic/react';
import { useOfflineMutation } from 'react-offix-hooks';
import { ITask } from '../declarations';
import { Empty } from './Empty';
import { mutationOptions } from '../helpers';
import { findTasks, updateTask, deleteTask } from '../graphql/generated';

export const TaskList: React.FC<any> = ({ tasks }) => {

  const [updateTaskMutation] = useOfflineMutation(updateTask, mutationOptions.updateTask);
  const [deleteTaskMutation] = useOfflineMutation(deleteTask, {
    update: (store, { data: op }) => {
      let data = store.readQuery({ query: findTasks });
      // @ts-ignore
      const items = data.findTasks.items.filter((item) => item.id !== op.deleteTask.id);
      // @ts-ignore
      data.findTasks.items = items;
      store.writeQuery({ query: findTasks, data});
    }
  });

  const [showToast, setShowToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleError = (error: any) => {
    if (error.offline) {
      error.watchOfflineChange();
    }
    if (error.graphQLErrors) {
      console.log(error.graphQLErrors);
      setErrorMessage(error.message);
      setShowToast(true);
    }
  }

  const handleDelete = (task: ITask) => {
    const { comments, __typename, createdAt, updatedAt, ...input } = task as any;
    deleteTaskMutation({
      variables: { input }
    }).catch(handleError);
  };

  const handleUpdate = (task: ITask) => {
    const { comments, __typename, createdAt, updatedAt, ...input } = task as any;
    updateTaskMutation({
      variables: { input }
    })
      .catch(handleError);
  }

  if (tasks.length < 1) {
    const message = (<p>You currently have no tasks.</p>);
    return <Empty message={message} />
  };

  return (
    <>
      <IonList>
        {
          tasks.map((task: ITask) => {
            return <Task key={task.id} task={task} updateTask={handleUpdate} deleteTask={handleDelete} />;
          })
        }
      </IonList>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={errorMessage}
        position="top"
        color="danger"
        duration={2000}
      />
    </>
  );

};
