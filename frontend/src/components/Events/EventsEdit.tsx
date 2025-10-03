import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button, DatePicker, Form, Input, Popconfirm, Radio,Select } from 'antd';

import { eventType } from "enums/events"
import type { EventFormValues, EventsEditFormValuesInternal } from 'types/events';
import { RECURRENCE_VALUES }  from 'types/events';

import { calculateNextDate } from "../../utils/date";
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import "./EventsEdit.css";

const { TextArea } = Input;

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
  [eventType.CHURCH]: "Церковный праздник",
  [eventType.OTHER]: "Другое",
};

const eventTypeOrder: eventType[] = [eventType.HOLIDAY, eventType.BIRTHDAY, eventType.CHURCH, eventType.OTHER];

const eventTypesOptions = eventTypeOrder.map((value) => ({
  value,
  label: eventTypeLabel[value],
}));

const recurrenceOptions = RECURRENCE_VALUES.map(v => ({
  value: v,
  label: v === 'none' ? 'Без повторения' : v === 'monthly' ? 'Ежемесячное' : 'Ежегодное',
}));

const toExternalValues = (values: EventsEditFormValuesInternal): EventFormValues => {
  const date = values.originalDate;

  return {
    title: values.title || "",
    originalDate: date ? date.format('YYYY-MM-DD') : "",
    type: values.type || DEFAULT_EVENT_TYPE,
    recurrence: values.recurrence || 'none',
    description: values.description || "",
  };
};

const EventsEdit: React.FC<EventsEditProps> = ({ initialValues, onSubmit, onCancel, onDelete, ref }) => {
  const form = useRef<any>(null);
  const [nextDate, setNextDate] = useState<Dayjs | null>(null);

  /**
   * Вычисляет следующую дату события на основе originalDate и recurrence
   * @param originalDate - исходная дата события
   * @param recurrence - тип повторения
   */
  const calculateNextDateValue = (originalDate: Dayjs | undefined, recurrence: string) => {
    if (!originalDate || !recurrence) {
      setNextDate(null);
      return;
    }

    const originalDateString = originalDate.format('YYYY-MM-DD');
    const nextDateString = calculateNextDate(originalDateString, recurrence);
    
    if (nextDateString) {
      setNextDate(dayjs(nextDateString));
    } else {
      setNextDate(null);
    }
  };

  const formInitialValues: EventsEditFormValuesInternal = useMemo(() => {
    const iv = initialValues || {};
    const isEditing = Boolean(initialValues);
    const dateValue: Dayjs | undefined = iv.originalDate
      ? dayjs(iv.originalDate as string)
      : undefined;

    return {
      title: iv.title,
      originalDate: dateValue,
      type: iv.type || DEFAULT_EVENT_TYPE,
      recurrence: isEditing ? (iv.recurrence ?? 'none') : 'none',
      description: iv.description,
    };
  }, [initialValues]);

  useEffect(() => {
    if (form.current && formInitialValues) {
      form.current.setFieldsValue(formInitialValues);
    }
  }, [formInitialValues]);

  useEffect(() => {
    calculateNextDateValue(formInitialValues.originalDate, formInitialValues.recurrence || 'none');
  }, [formInitialValues.originalDate, formInitialValues.recurrence]);

  const handleChangeOriginalDate = (date: Dayjs | null) => {
    const formValues = form.current?.getFieldsValue();
    calculateNextDateValue(date || undefined, formValues?.recurrence || 'none');
  };

  const handleChangeRecurrence = (e: any) => {
    const recurrence = e.target.value;
    const formValues = form.current?.getFieldsValue();
    calculateNextDateValue(formValues?.originalDate, recurrence || 'none');
  };

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
            <label className="events-edit__form-item-label" htmlFor="originalDate">Дата начала события</label>
            <Form.Item name="originalDate"> 
              <DatePicker id="originalDate" placeholder="дата" onChange={handleChangeOriginalDate} />
            </Form.Item>
          </div>

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="nextDate">Следующая дата события</label>
            <DatePicker value={nextDate} id="nextDate" placeholder="дата" disabled />
          </div>          

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="type">Тип события</label>
            <Form.Item name="type">
              <Select options={eventTypesOptions}/>
            </Form.Item>
          </div>    

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label">Повторяемость события</label>
            <Form.Item name="recurrence" className="mb-0">
              <Radio.Group onChange={handleChangeRecurrence}>
                {recurrenceOptions.map((o) => (
                  <Radio key={o.value} value={o.value}>{o.label}</Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </div>

          <div className="events-edit__form-item">
            <label className="events-edit__form-item-label" htmlFor="description">Описание</label>
            <Form.Item name="description"> 
              <TextArea
                id="description"
                showCount
                maxLength={250}
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