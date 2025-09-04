import "./EventsEdit.css";

import type { SelectProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { eventType } from "../../enums/events"

import { Input, Button, DatePicker, Select, Radio, Form, Popconfirm, Checkbox } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useRef, useImperativeHandle, useEffect } from "react";
import { EventFormValues, EventsEditFormValuesInternal } from '../../types/events';

const { TextArea } = Input;

const options: SelectProps['options'] = ['Eugenia', 'Bryan', 'Linda', 'Nancy', 'Lloyd', 'Alice', 'Julia', 'Albert'].map(
  item => ({
    label: item,
    value: item.toLowerCase(),
  })
);

interface EventsEditProps {
  initialValues?: Partial<EventFormValues>;
  onSubmit?: (values: EventFormValues) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  ref?: React.Ref<EventsEditRef>;
}

export interface EventsEditRef {
  resetForm: () => void;
}

const DEFAULT_EVENT_TYPE = eventType.HOLIDAY;

const eventTypeLabel: Record<eventType, string> = {
  [eventType.HOLIDAY]: "Праздник",
  [eventType.BIRTHDAY]: "День рождения",
  [eventType.OTHER]: "Другое",
};

const eventTypeOrder: eventType[] = [eventType.HOLIDAY, eventType.BIRTHDAY, eventType.OTHER];

const eventTypesOptions = eventTypeOrder.map((value) => ({
  value,
  label: eventTypeLabel[value],
}));

const toExternalValues = (values: EventsEditFormValuesInternal): EventFormValues => {
  const date = values.date;

  return {
    title: values.title || "",
    date: date ? date.format('YYYY-MM-DD') : "",
    type: values.type || DEFAULT_EVENT_TYPE,
    isYearly: values.isYearly ?? false,
    tags: values.tags || [],
    description: values.description || "",
  };
};

const EventsEdit: React.FC<EventsEditProps> = ({ initialValues, onSubmit, onCancel, onDelete, ref }) => {
  const form = useRef<any>(null);

  const formInitialValues: EventsEditFormValuesInternal = useMemo(() => {
    const iv = initialValues || {};
    const isEditing = Boolean(initialValues);
    const dateValue: Dayjs | undefined = iv.date
      ? dayjs(iv.date as string)
      : undefined;

    return {
      title: iv.title,
      date: dateValue,
      type: iv.type || DEFAULT_EVENT_TYPE,
      isYearly: isEditing ? (iv.isYearly ?? false) : true,
      tags: iv.tags,
      description: iv.description,
    };
  }, [initialValues]);

  useEffect(() => {
    if (form.current && formInitialValues) {
      form.current.setFieldsValue(formInitialValues);
    }
  }, [formInitialValues]);

  useImperativeHandle(ref, () => ({
    resetForm: () => {
      form.current?.resetFields();

      if (formInitialValues && form.current) {
        form.current.setFieldsValue(formInitialValues);
      }
    }
  }), [formInitialValues]);  

  const handleFinish = (values: EventsEditFormValuesInternal) => {
    const result = toExternalValues(values);

    if (onSubmit) {
      onSubmit(result);
    } else {
      console.log("SUBMIT:", result);
    }
  };

  return (
    <div className="events-edit">
      <div className="events-edit__form">
        <Form
          ref={form}
          layout="vertical"
          initialValues={formInitialValues}
          onFinish={handleFinish}
        >
          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="title">Название события</label>
            <Form.Item name="title"> 
              <Input id="title" placeholder="Пожалуйста введите название события" />
            </Form.Item>
          </div>

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="date">Дата</label>
            <Form.Item name="date"> 
              <DatePicker id="date" placeholder="дата" />
            </Form.Item>
          </div>

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="type">Тип события</label>
            <Form.Item name="type"> 
              <Radio.Group
                id="type"
                name="radiogroup"
                options={eventTypesOptions}
              />
            </Form.Item>
          </div>

          <Form.Item name="isYearly" valuePropName="checked">
            <Checkbox>Ежегодное событие</Checkbox>
          </Form.Item>

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="tags">Теги</label>
            <Form.Item name="tags"> 
              <Select
                id="tags"
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Tags Mode"
                options={options}
                maxTagCount='responsive'
                allowClear
              />
            </Form.Item>
          </div>

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="description">Описание</label>
            <Form.Item name="description"> 
              <TextArea
                id="description"
                showCount
                maxLength={100}
                placeholder="Укажите описание события"
                style={{ height: 120, resize: 'none' }}
              />
            </Form.Item>
          </div>

          <div className="events-edit__form-buttons">
            <Popconfirm
              title="Удаление события"
              description="Вы действительно хотите удалить это событие?"
              onConfirm={onDelete}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                shape="round"
                color="danger"
                variant="text"
                htmlType="button"
              >Удалить</Button>
            </Popconfirm>            
            <Button
              shape="round"
              color="default"
              variant="filled"
              className="ml-auto"
              htmlType="button"
              onClick={onCancel}
            >Отменить</Button>
            <Button
              shape="round"
              type="primary"
              className="ml-3"
              htmlType="submit"
            >Сохранить</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EventsEdit;