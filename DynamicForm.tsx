import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export type QuestionType = 'boolean' | 'text' | 'choice';

export interface FormQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
}

interface DynamicFormProps {
  questions: FormQuestion[];
  onSubmit: (answers: Record<string, any>) => void;
}

export default function DynamicForm({ questions, onSubmit }: DynamicFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const renderQuestion = (q: FormQuestion) => {
    switch (q.type) {
      case 'boolean':
        return (
          <View style={styles.booleanContainer} key={q.id}>
            <TouchableOpacity 
              style={[styles.boolButton, answers[q.id] === true && styles.boolButtonActivePass]} 
              onPress={() => handleAnswer(q.id, true)}>
              <Text style={styles.boolText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.boolButton, answers[q.id] === false && styles.boolButtonActiveFail]} 
              onPress={() => handleAnswer(q.id, false)}>
              <Text style={styles.boolText}>Fail</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {questions.map((q) => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionText}>{q.question}</Text>
          {renderQuestion(q)}
        </View>
      ))}
      <TouchableOpacity style={styles.submitBtn} onPress={() => onSubmit(answers)}>
        <Text style={styles.submitBtnText}>Complete Inspection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  questionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  boolButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  boolButtonActivePass: {
    backgroundColor: '#059669', // Emerald
    borderColor: '#059669',
  },
  boolButtonActiveFail: {
    backgroundColor: '#e11d48', // Rose
    borderColor: '#e11d48',
  },
  boolText: {
    color: '#fff',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
