import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

// Helper function to format date without timezone issues
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get date range based on filter
const getDateRange = (filter) => {
  const endDate = new Date();
  let startDate = new Date();
  
  switch(filter) {
    case '1day':
      startDate.setDate(endDate.getDate());
      break;
    case '1week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '15days':
      startDate.setDate(endDate.getDate() - 15);
      break;
    case '1month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }
  
  return {
    start: formatDate(startDate),
    end: formatDate(endDate)
  };
};

// Dashboard Screen
function DashboardScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [rents, setRents] = useState([]);
  const [timeFilter, setTimeFilter] = useState('1month');
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filteredRents, setFilteredRents] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  useEffect(() => {
    loadAllData();
  }, [timeFilter]);

  const loadAllData = async () => {
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      const allExpenses = storedExpenses ? JSON.parse(storedExpenses) : [];
      setExpenses(allExpenses);

      const storedRents = await AsyncStorage.getItem('rents');
      const allRents = storedRents ? JSON.parse(storedRents) : [];
      setRents(allRents);

      applyFilter(timeFilter, allExpenses, allRents);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const applyFilter = (filter, expData, rentData) => {
    const range = getDateRange(filter);
    const filteredExp = expData.filter(item => item.date >= range.start && item.date <= range.end);
    const filteredRent = rentData.filter(item => item.date >= range.start && item.date <= range.end);
    setFilteredExpenses(filteredExp);
    setFilteredRents(filteredRent);
  };

  const handleFilterChange = (filter) => {
    setTimeFilter(filter);
    applyFilter(filter, expenses, rents);
  };

  const totalExpense = filteredExpenses.filter(exp => exp.type === 'expense').reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = filteredExpenses.filter(exp => exp.type === 'income').reduce((sum, exp) => sum + exp.amount, 0);
  const totalRentGiven = filteredRents.filter(r => r.type === 'given').reduce((sum, r) => sum + r.amount, 0);
  const totalRentReceived = filteredRents.filter(r => r.type === 'received').reduce((sum, r) => sum + r.amount, 0);
  const netBalance = totalIncome + totalRentReceived - (totalExpense + totalRentGiven);

  const getFilterLabel = () => {
    switch(timeFilter) {
      case '1day': return 'Last 24 Hours';
      case '1week': return 'Last 7 Days';
      case '15days': return 'Last 15 Days';
      case '1month': return 'Last 30 Days';
      default: return 'Last 30 Days';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SpendWise</Text>
          <Text style={styles.headerSubtitle}>Track your finances smartly</Text>
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Time Period:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity 
              style={[styles.filterButton, timeFilter === '1day' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('1day')}>
              <Text style={[styles.filterButtonText, timeFilter === '1day' && styles.filterButtonTextActive]}>1 Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, timeFilter === '1week' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('1week')}>
              <Text style={[styles.filterButtonText, timeFilter === '1week' && styles.filterButtonTextActive]}>1 Week</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, timeFilter === '15days' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('15days')}>
              <Text style={[styles.filterButtonText, timeFilter === '15days' && styles.filterButtonTextActive]}>15 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, timeFilter === '1month' && styles.filterButtonActive]}
              onPress={() => handleFilterChange('1month')}>
              <Text style={[styles.filterButtonText, timeFilter === '1month' && styles.filterButtonTextActive]}>1 Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary ({getFilterLabel()})</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, styles.expenseText]}>-₹{totalExpense}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>+₹{totalIncome}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rent Given</Text>
              <Text style={[styles.summaryValue, styles.expenseText]}>-₹{totalRentGiven}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rent Received</Text>
              <Text style={[styles.summaryValue, styles.incomeText]}>+₹{totalRentReceived}</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Net Balance</Text>
            <Text style={[styles.totalValue, netBalance >= 0 ? styles.incomeText : styles.expenseText]}>
              ₹{netBalance}
            </Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {[...filteredExpenses, ...filteredRents]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map((item, index) => (
              <View key={index} style={styles.activityItem}>
                <Ionicons
                  name={item.type === 'expense' || item.type === 'given' ? 'arrow-down' : 'arrow-up'}
                  size={20}
                  color={item.type === 'expense' || item.type === 'given' ? '#FF6B6B' : '#4ECDC4'}
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityDesc}>
                    {item.description || `Rent ${item.type === 'given' ? 'to' : 'from'} ${item.personName}`}
                  </Text>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: item.type === 'expense' || item.type === 'given' ? '#FF6B6B' : '#4ECDC4' }]}>
                  {item.type === 'expense' || item.type === 'given' ? '-' : '+'}₹{item.amount}
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Expenses Screen - Shows only selected date expenses
function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');
  const [editingId, setEditingId] = useState(null);
  const [filterAmount, setFilterAmount] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [selectedDate])
  );

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem('expenses');
      const allExpenses = stored ? JSON.parse(stored) : [];
      // Filter expenses for the selected date only
      const filtered = allExpenses.filter(exp => exp.date === selectedDate);
      setExpenses(filtered);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const saveExpense = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const expense = {
      id: editingId || Date.now().toString(),
      amount: parseFloat(amount),
      description,
      type,
      date: selectedDate,
    };

    try {
      const stored = await AsyncStorage.getItem('expenses');
      const allExpenses = stored ? JSON.parse(stored) : [];
      
      if (editingId) {
        const index = allExpenses.findIndex(item => item.id === editingId);
        if (index !== -1) allExpenses[index] = expense;
        setEditingId(null);
      } else {
        allExpenses.push(expense);
      }
      
      await AsyncStorage.setItem('expenses', JSON.stringify(allExpenses));
      
      setAmount('');
      setDescription('');
      setType('expense');
      setShowModal(false);
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const deleteExpense = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const stored = await AsyncStorage.getItem('expenses');
          const allExpenses = stored ? JSON.parse(stored) : [];
          const updated = allExpenses.filter(item => item.id !== id);
          await AsyncStorage.setItem('expenses', JSON.stringify(updated));
          loadExpenses();
        }
      }
    ]);
  };

  let filteredExpenses = expenses;
  if (filterAmount) {
    filteredExpenses = expenses.filter(item => item.amount >= parseFloat(filterAmount));
  }
  
  filteredExpenses = filteredExpenses.sort((a, b) => {
    return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
  });

  // Calculate totals for the selected date
  const totalExpense = expenses.filter(exp => exp.type === 'expense').reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = expenses.filter(exp => exp.type === 'income').reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>Date: {selectedDate}</Text>
      </View>

      <View style={styles.dateSummary}>
        <View style={styles.dateSummaryItem}>
          <Text style={styles.dateSummaryLabel}>Today's Expenses</Text>
          <Text style={[styles.dateSummaryValue, styles.expenseText]}>-₹{totalExpense}</Text>
        </View>
        <View style={styles.dateSummaryItem}>
          <Text style={styles.dateSummaryLabel}>Today's Income</Text>
          <Text style={[styles.dateSummaryValue, styles.incomeText]}>+₹{totalIncome}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Min Amount (₹)"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={filterAmount}
          onChangeText={setFilterAmount}
        />
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
          <Ionicons name="funnel" size={20} color="#4A90E2" />
          <Text style={styles.sortButtonText}>{sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Expense/Income</Text>
      </TouchableOpacity>

      <ScrollView>
        {filteredExpenses.map(item => (
          <View key={item.id} style={styles.activityItem}>
            <Ionicons
              name={item.type === 'expense' ? 'arrow-down' : 'arrow-up'}
              size={20}
              color={item.type === 'expense' ? '#FF6B6B' : '#4ECDC4'}
            />
            <Text style={styles.activityDesc}>{item.description}</Text>
            <Text style={[styles.activityAmount, { color: item.type === 'expense' ? '#FF6B6B' : '#4ECDC4' }]}>
              {item.type === 'expense' ? '-' : '+'}₹{item.amount}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => {
                setEditingId(item.id);
                setAmount(item.amount.toString());
                setDescription(item.description);
                setType(item.type);
                setShowModal(true);
              }} style={styles.actionButton}>
                <Ionicons name="create" size={22} color="#4A90E2" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteExpense(item.id)} style={styles.actionButton}>
                <Ionicons name="trash" size={22} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filteredExpenses.length === 0 && (
          <Text style={styles.emptyText}>No transactions for this date</Text>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit' : 'Add'} Transaction</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'expense' && styles.activeType]}
                onPress={() => setType('expense')}>
                <Text style={styles.typeButtonText}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'income' && styles.activeType]}
                onPress={() => setType('income')}>
                <Text style={styles.typeButtonText}>Income</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowModal(false);
                setEditingId(null);
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveExpense}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Rent Screen
function RentScreen() {
  const [rents, setRents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState('given');
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  useFocusEffect(
    useCallback(() => {
      loadRents();
    }, [selectedDate])
  );

  const loadRents = async () => {
    try {
      const stored = await AsyncStorage.getItem('rents');
      const allRents = stored ? JSON.parse(stored) : [];
      const filtered = allRents.filter(rent => rent.date === selectedDate);
      setRents(filtered);
    } catch (error) {
      console.error('Error loading rents:', error);
    }
  };

  const saveRent = async () => {
    if (!amount || !personName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const rent = {
      id: editingId || Date.now().toString(),
      amount: parseFloat(amount),
      personName,
      type,
      date: selectedDate,
    };

    try {
      const stored = await AsyncStorage.getItem('rents');
      const allRents = stored ? JSON.parse(stored) : [];
      
      if (editingId) {
        const index = allRents.findIndex(item => item.id === editingId);
        if (index !== -1) allRents[index] = rent;
        setEditingId(null);
      } else {
        allRents.push(rent);
      }
      
      await AsyncStorage.setItem('rents', JSON.stringify(allRents));
      
      setAmount('');
      setPersonName('');
      setType('given');
      setShowModal(false);
      loadRents();
    } catch (error) {
      console.error('Error saving rent:', error);
    }
  };

  const deleteRent = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const stored = await AsyncStorage.getItem('rents');
          const allRents = stored ? JSON.parse(stored) : [];
          const updated = allRents.filter(item => item.id !== id);
          await AsyncStorage.setItem('rents', JSON.stringify(updated));
          loadRents();
        }
      }
    ]);
  };

  const totalRentGiven = rents.filter(r => r.type === 'given').reduce((sum, r) => sum + r.amount, 0);
  const totalRentReceived = rents.filter(r => r.type === 'received').reduce((sum, r) => sum + r.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>Date: {selectedDate}</Text>
      </View>

      <View style={styles.dateSummary}>
        <View style={styles.dateSummaryItem}>
          <Text style={styles.dateSummaryLabel}>Rent Given</Text>
          <Text style={[styles.dateSummaryValue, styles.expenseText]}>-₹{totalRentGiven}</Text>
        </View>
        <View style={styles.dateSummaryItem}>
          <Text style={styles.dateSummaryLabel}>Rent Received</Text>
          <Text style={[styles.dateSummaryValue, styles.incomeText]}>+₹{totalRentReceived}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Rent Transaction</Text>
      </TouchableOpacity>

      <ScrollView>
        {rents.map(item => (
          <View key={item.id} style={styles.activityItem}>
            <Ionicons name="cash" size={20} color="#FFB347" />
            <Text style={styles.activityDesc}>
              Rent {item.type === 'given' ? 'to' : 'from'} {item.personName}
            </Text>
            <Text style={[styles.activityAmount, { color: item.type === 'given' ? '#FF6B6B' : '#4ECDC4' }]}>
              {item.type === 'given' ? '-' : '+'}₹{item.amount}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => {
                setEditingId(item.id);
                setAmount(item.amount.toString());
                setPersonName(item.personName);
                setType(item.type);
                setShowModal(true);
              }} style={styles.actionButton}>
                <Ionicons name="create" size={22} color="#4A90E2" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteRent(item.id)} style={styles.actionButton}>
                <Ionicons name="trash" size={22} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {rents.length === 0 && (
          <Text style={styles.emptyText}>No rent transactions for this date</Text>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit' : 'Add'} Rent Transaction</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'given' && styles.activeType]}
                onPress={() => setType('given')}>
                <Text style={styles.typeButtonText}>Rent Given</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'received' && styles.activeType]}
                onPress={() => setType('received')}>
                <Text style={styles.typeButtonText}>Rent Received</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount (₹)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Person Name"
              placeholderTextColor="#999"
              value={personName}
              onChangeText={setPersonName}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowModal(false);
                setEditingId(null);
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveRent}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Calendar Screen - Shows correct + and - for income/expense
function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [rents, setRents] = useState([]);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const today = new Date();

  useFocusEffect(
    useCallback(() => {
      loadDataForMonth();
    }, [selectedDate, refreshKey])
  );

  const loadDataForMonth = async () => {
    const yearMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    try {
      const storedExpenses = await AsyncStorage.getItem('expenses');
      const allExpenses = storedExpenses ? JSON.parse(storedExpenses) : [];
      const monthlyExpenses = allExpenses.filter(exp => exp.date.startsWith(yearMonth));
      setExpenses(monthlyExpenses);

      const storedRents = await AsyncStorage.getItem('rents');
      const allRents = storedRents ? JSON.parse(storedRents) : [];
      const monthlyRents = allRents.filter(rent => rent.date.startsWith(yearMonth));
      setRents(monthlyRents);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const refreshCalendar = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getActivitiesForDate = (date) => {
    const dateStr = formatDate(date);
    const dayExpenses = expenses.filter(exp => exp.date === dateStr);
    const dayRents = rents.filter(rent => rent.date === dateStr);
    return { expenses: dayExpenses, rents: dayRents };
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const changeMonth = (increment) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + increment, 1));
  };

  const isToday = (date) => {
    return date && 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();
  };

  const onDayPress = (date) => {
    if (date) {
      const data = getActivitiesForDate(date);
      setSelectedDayData({ date, ...data });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={refreshCalendar}>
          <Ionicons name="refresh" size={20} color="#4A90E2" />
          <Text style={styles.refreshButtonText}>Refresh Calendar</Text>
        </TouchableOpacity>

        <View style={styles.calendar}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarDays}>
            {generateCalendarDays().map((date, index) => {
              if (!date) return <View key={index} style={styles.calendarDay} />;
              const data = getActivitiesForDate(date);
              const hasActivity = data.expenses.length > 0 || data.rents.length > 0;
              const currentDate = isToday(date);
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.calendarDay}
                  onPress={() => onDayPress(date)}>
                  <View style={[
                    styles.dateCircle,
                    currentDate && styles.currentDateCircle
                  ]}>
                    <Text style={[styles.dayNumber, currentDate && styles.currentDateText]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  {hasActivity && !currentDate && <View style={styles.activityDot} />}
                  {hasActivity && currentDate && <View style={styles.activityDotWhite} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedDayData && (
          <View style={styles.dayDetails}>
            <Text style={styles.sectionTitle}>
              {formatDate(selectedDayData.date)}
              {isToday(selectedDayData.date) && <Text style={styles.todayBadge}> (Today)</Text>}
            </Text>
            {selectedDayData.expenses.map(exp => (
              <View key={exp.id} style={styles.activityItem}>
                <Ionicons name={exp.type === 'expense' ? 'arrow-down' : 'arrow-up'} size={20} color={exp.type === 'expense' ? '#FF6B6B' : '#4ECDC4'} />
                <Text style={styles.activityDesc}>{exp.description}</Text>
                <Text style={[styles.activityAmount, exp.type === 'expense' ? styles.expenseText : styles.incomeText]}>
                  {exp.type === 'expense' ? '-' : '+'}₹{exp.amount}
                </Text>
              </View>
            ))}
            {selectedDayData.rents.map(rent => (
              <View key={rent.id} style={styles.activityItem}>
                <Ionicons name="cash" size={20} color="#FFB347" />
                <Text style={styles.activityDesc}>Rent {rent.type === 'given' ? 'to' : 'from'} {rent.personName}</Text>
                <Text style={[styles.activityAmount, rent.type === 'given' ? styles.expenseText : styles.incomeText]}>
                  {rent.type === 'given' ? '-' : '+'}₹{rent.amount}
                </Text>
              </View>
            ))}
            {selectedDayData.expenses.length === 0 && selectedDayData.rents.length === 0 && (
              <Text style={styles.emptyText}>No activities on this day</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// About Screen
function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.aboutContainer}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={80} color="#4A90E2" />
            <Text style={styles.appName}>SpendWise</Text>
            <Text style={styles.tagline}>Smart Expense Tracker</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About SpendWise</Text>
            <Text style={styles.infoText}>
              SpendWise helps you track your daily expenses, manage rent transactions, and maintain financial discipline. Take control of your finances with our easy-to-use expense tracker.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Features</Text>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Track expenses and income</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Manage rent transactions</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>View calendar with daily activities</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Filter expenses by amount</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>Time-based summaries</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Version</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with ❤️</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Dashboard') iconName = 'home';
              else if (route.name === 'Expenses') iconName = 'card';
              else if (route.name === 'Rent') iconName = 'people';
              else if (route.name === 'Calendar') iconName = 'calendar';
              else if (route.name === 'About') iconName = 'information-circle';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4A90E2',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}>
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Expenses" component={ExpensesScreen} />
          <Tab.Screen name="Rent" component={RentScreen} />
          <Tab.Screen name="Calendar" component={CalendarScreen} />
          <Tab.Screen name="About" component={AboutScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  filterContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    padding: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#FF6B6B',
  },
  incomeText: {
    color: '#4ECDC4',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeType: {
    backgroundColor: '#4A90E2',
  },
  typeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  recentSection: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  activityContent: {
    flex: 1,
    marginLeft: 10,
  },
  activityDesc: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginLeft: 10,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
  },
  dateHeader: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  dateSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  dateSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateSummaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  dateSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  calendar: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDateCircle: {
    backgroundColor: '#4A90E2',
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  currentDateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activityDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A90E2',
  },
  activityDotWhite: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  dayDetails: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  todayBadge: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: 'normal',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontSize: 14,
  },
  aboutContainer: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 10,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  versionText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});