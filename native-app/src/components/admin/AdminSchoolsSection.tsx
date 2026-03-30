import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Building2, ChevronDown, MapPin, Plus } from 'lucide-react-native';

import { SchoolData } from '../../types/app';

interface AdminSchoolsSectionProps {
  styles: Record<string, any>;
  schoolSort: string;
  schoolSortOpen: boolean;
  schoolsList: SchoolData[];
  onToggleSortMenu: () => void;
  onSelectSort: (value: string) => void;
  onAddSchool: () => void;
  onSelectSchool: (school: SchoolData) => void;
}

export function AdminSchoolsSection({
  styles,
  schoolSort,
  schoolSortOpen,
  schoolsList,
  onToggleSortMenu,
  onSelectSort,
  onAddSchool,
  onSelectSchool,
}: AdminSchoolsSectionProps) {
  const mostActiveSchool =
    schoolsList.length > 0
      ? [...schoolsList].sort((left, right) => right.totalStudents - left.totalStudents)[0]
      : null;

  return (
    <>
      <View style={styles.pageHeadRow}>
        <View style={styles.pageHead}>
          <Text style={styles.pageTitle}>Schools</Text>
          <Text style={styles.pageSub}>Manage partner schools.</Text>
        </View>
        <View style={styles.menuWrap}>
          <Pressable onPress={onToggleSortMenu} style={styles.chip}>
            <Text style={styles.chipText}>{schoolSort}</Text>
            <ChevronDown size={14} color="#94A3B8" />
          </Pressable>
          {schoolSortOpen ? (
            <View style={styles.menu}>
              {['All Grades (Sort)', 'Most Students', 'Least Students', 'A-Z'].map(option => (
                <Pressable
                  key={option}
                  onPress={() => onSelectSort(option)}
                  style={[styles.menuItem, schoolSort === option && styles.menuItemActive]}>
                  <Text style={[styles.menuText, schoolSort === option && styles.menuTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.heroCard, styles.blue]}>
          <Text style={styles.heroLabel}>Total Schools</Text>
          <Text style={styles.heroValue}>{schoolsList.length}</Text>
        </View>
        <View style={[styles.heroCard, styles.green]}>
          <Text style={styles.heroLabel}>Largest School</Text>
          <Text style={styles.panelTitleLight}>
            {mostActiveSchool ? mostActiveSchool.name : 'No school data yet'}
          </Text>
        </View>
      </View>

      <Pressable onPress={onAddSchool} style={styles.addSchool}>
        <Plus size={18} color="#9CA3AF" />
        <Text style={styles.addSchoolText}>Register New School</Text>
      </Pressable>

      <View style={styles.list}>
        {schoolsList.length > 0 ? (
          schoolsList.map(school => (
            <Pressable key={school.id} onPress={() => onSelectSchool(school)} style={styles.listItem}>
              <View style={styles.row}>
                <View style={styles.schoolIcon}>
                  <Building2 size={22} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.itemTitle}>{school.name}</Text>
                  <View style={styles.rowTinyWrap}>
                    <MapPin size={12} color="#9CA3AF" />
                    <Text style={styles.itemMeta}>{school.location}</Text>
                  </View>
                </View>
              </View>
              <View>
                <Text style={styles.itemTitle}>{school.totalStudents}</Text>
                <Text style={styles.itemMeta}>Students</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No schools registered yet.</Text>
          </View>
        )}
      </View>
    </>
  );
}
